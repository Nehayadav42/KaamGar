import bcrypt from 'bcryptjs'
import { ROLES, USER_STATUS } from '../constants/roles.js'
import { withTransaction } from '../db/pool.js'
import * as cooperatives from '../repositories/cooperatives.js'
import * as workers from '../repositories/workers.js'
import * as refreshTokens from '../repositories/refreshTokens.js'
import * as users from '../repositories/users.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { audit } from '../utils/audit.js'
import { REFRESH_COOKIE, clearRefreshCookie, hashToken, issueSession } from '../utils/tokens.js'

const BCRYPT_COST = 12
const MAX_FAILED_ATTEMPTS = 5
const LOCK_MINUTES = 15
// Used to make "unknown email" take as long as "wrong password" (stops user enumeration by timing)
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST)

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data })

// POST /auth/register: customers and workers only
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, cooperativeId } = req.body

  let cooperative = null
  if (role === ROLES.WORKER) {
    // Single-cooperative pilot: no choice given means the default cooperative
    cooperative = cooperativeId ? await cooperatives.findActiveById(cooperativeId) : await cooperatives.findDefault()
    if (!cooperative) throw ApiError.badRequest('Choose a valid cooperative')
  }
  if (await users.emailExists(email)) throw ApiError.conflict('An account with this email already exists')

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST)
  const row = await withTransaction(async (client) => {
    const created = await users.create(
      {
        name,
        email,
        phone,
        role,
        passwordHash,
        cooperativeId: cooperative?.id ?? null,
        // A new worker waits for the cooperative to approve them
        status: role === ROLES.WORKER ? USER_STATUS.PENDING : USER_STATUS.ACTIVE,
      },
      client,
    )
    if (role === ROLES.WORKER) await workers.createEmptyProfile(created.id, client)
    return created
  })

  const user = users.toPublicUser(row)
  await audit(req, 'REGISTER', { actor: user, targetType: 'User', targetId: user.id, meta: { role } })
  const accessToken = await issueSession(row, req, res)
  ok(res, { user, accessToken }, 201)
})

// POST /auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const row = await users.findByEmail(email)

  if (!row) {
    await bcrypt.compare(password, DUMMY_HASH)
    await audit(req, 'LOGIN_FAILED', { meta: { reason: 'unknown_email' } })
    throw ApiError.unauthorized('Invalid email or password')
  }
  const user = users.toPublicUser(row)

  if (row.lock_until && row.lock_until > new Date()) {
    await audit(req, 'LOGIN_BLOCKED_LOCKED', { actor: user })
    throw ApiError.tooMany('Too many failed attempts. Try again in a few minutes.')
  }

  if (!(await bcrypt.compare(password, row.password_hash))) {
    const { locked } = await users.recordFailedLogin(row.id, MAX_FAILED_ATTEMPTS, LOCK_MINUTES)
    await audit(req, locked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED', { actor: user, meta: { reason: 'wrong_password' } })
    throw ApiError.unauthorized('Invalid email or password')
  }

  // Password is right, so it is now safe to say why the account cannot be used
  if (row.status === USER_STATUS.SUSPENDED) {
    await audit(req, 'LOGIN_BLOCKED_SUSPENDED', { actor: user })
    throw ApiError.forbidden('This account is suspended')
  }

  await users.recordSuccessfulLogin(row.id)
  await audit(req, 'LOGIN_SUCCESS', { actor: user })
  const accessToken = await issueSession(row, req, res)
  ok(res, { user, accessToken })
})

// POST /auth/refresh: swaps the refresh cookie for a new one + a new access token
export const refresh = asyncHandler(async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE]
  if (!raw) throw ApiError.unauthorized('Refresh token missing')
  const tokenHash = hashToken(raw)

  const used = await refreshTokens.consume(tokenHash) // only one request can win this
  if (!used) {
    const known = await refreshTokens.findByHash(tokenHash)
    if (known?.revoked_at) {
      // A token that was already rotated is being replayed: assume theft and kill the whole session
      await refreshTokens.revokeFamily(known.family_id)
      await audit(req, 'REFRESH_REUSE_DETECTED', { targetType: 'User', targetId: known.user_id })
    }
    clearRefreshCookie(res)
    throw ApiError.unauthorized('Session expired. Please log in again.')
  }

  const row = await users.findById(used.user_id)
  if (!row || row.status === USER_STATUS.SUSPENDED) {
    await refreshTokens.revokeFamily(used.family_id)
    clearRefreshCookie(res)
    throw ApiError.unauthorized('Session expired. Please log in again.')
  }

  const accessToken = await issueSession(row, req, res, { familyId: used.family_id })
  ok(res, { user: users.toPublicUser(row), accessToken })
})

// POST /auth/logout: ends this session only
export const logout = asyncHandler(async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE]
  if (raw) {
    const doc = await refreshTokens.findByHash(hashToken(raw))
    if (doc) {
      await refreshTokens.revokeFamily(doc.family_id)
      await audit(req, 'LOGOUT', { targetType: 'User', targetId: doc.user_id })
    }
  }
  clearRefreshCookie(res)
  ok(res, { message: 'Logged out' })
})

// POST /auth/logout-all: ends every session on every device
export const logoutAll = asyncHandler(async (req, res) => {
  await withTransaction(async (client) => {
    await refreshTokens.revokeAllForUser(req.user.id, client)
    await users.bumpTokenVersion(req.user.id, client)
  })
  await audit(req, 'LOGOUT_ALL')
  clearRefreshCookie(res)
  ok(res, { message: 'Logged out of all devices' })
})

// GET /auth/me
export const me = asyncHandler(async (req, res) => ok(res, { user: req.user }))

// PATCH /auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const row = await users.findById(req.user.id)

  if (!(await bcrypt.compare(currentPassword, row.password_hash))) {
    await audit(req, 'PASSWORD_CHANGE_FAILED')
    throw ApiError.unauthorized('Current password is incorrect')
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_COST)
  // New password + every old session revoked, as one all-or-nothing step
  const updated = await withTransaction(async (client) => {
    const u = await users.setPassword(row.id, newHash, client) // also bumps token_version
    await refreshTokens.revokeAllForUser(row.id, client)
    return u
  })
  await audit(req, 'PASSWORD_CHANGED')

  const accessToken = await issueSession(updated, req, res) // keep this device logged in
  ok(res, { message: 'Password changed', accessToken })
})
