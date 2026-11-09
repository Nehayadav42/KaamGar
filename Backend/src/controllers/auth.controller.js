import bcrypt from 'bcryptjs'
import { ROLES, USER_STATUS } from '../constants/roles.js'
import { withTransaction } from '../db/pool.js'
import * as authTokens from '../repositories/authTokens.js'
import * as cooperatives from '../repositories/cooperatives.js'
import * as refreshTokens from '../repositories/refreshTokens.js'
import * as services from '../repositories/services.js'
import * as users from '../repositories/users.js'
import * as workers from '../repositories/workers.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { audit } from '../utils/audit.js'
import { resetEmail } from '../utils/emailTemplates.js'
import { sendMail } from '../utils/mailer.js'
import { notifyCoopAdmins, notifyPlatformAdmins } from '../utils/notify.js'
import { INVITE_HOURS, SELF_RESET_MINUTES, createSetupLink } from '../utils/setupLinks.js'
import { REFRESH_COOKIE, clearRefreshCookie, hashToken, issueSession } from '../utils/tokens.js'
import { inviteEmail } from '../utils/emailTemplates.js'

const BCRYPT_COST = 12
const MAX_FAILED_ATTEMPTS = 5
const LOCK_MINUTES = 15
// Used to make "unknown email" take as long as "wrong password" (stops user enumeration by timing)
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_COST)

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data })

// The platform admin may only sign in through the platform door, and nobody else may use it.
// A wrong door gets the same message as a wrong password, so the account type is not revealed.
const doorAllows = (door, role) => !door || (role === ROLES.PLATFORM_ADMIN) === (door === 'platform')

// POST /auth/register: customers and workers only
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, cooperativeId, shramikCardNumber, serviceIds, areas } = req.body

  let cooperative = null
  if (role === ROLES.WORKER) {
    cooperative = await cooperatives.findActiveById(cooperativeId)
    if (!cooperative) throw ApiError.badRequest('Choose a valid cooperative')
    // Skills must be real, active services of that cooperative
    if ((await services.countActiveInCoop(serviceIds, cooperative.id)) !== serviceIds.length) {
      throw ApiError.badRequest('Choose your skills from the list')
    }
    if (await workers.cardExists(shramikCardNumber)) throw ApiError.conflict('This Shramik card number is already registered')
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
        // A new worker waits for the cooperative to review them
        status: role === ROLES.WORKER ? USER_STATUS.PENDING : USER_STATUS.ACTIVE,
      },
      client,
    )
    if (role === ROLES.WORKER) await workers.createProfile(created.id, { serviceIds, areas, shramikCardNumber }, client)
    return created
  })

  const user = users.toPublicUser(row)
  await audit(req, 'REGISTER', { actor: user, targetType: 'User', targetId: user.id, meta: { role } })
  if (role === ROLES.WORKER) {
    await notifyCoopAdmins(cooperative.id, {
      type: 'worker.pending',
      title: 'New worker waiting for approval',
      body: `${user.name} wants to join your cooperative. Review their details.`,
      link: '/admin/workers',
    })
  }
  const accessToken = await issueSession(row, req, res)
  ok(res, { user, accessToken }, 201)
})

// POST /auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password, door } = req.body
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

  if (!doorAllows(door, row.role)) {
    await audit(req, 'LOGIN_WRONG_DOOR', { actor: user, meta: { door } })
    throw ApiError.unauthorized('Invalid email or password')
  }

  // Password is right, so it is now safe to say why the account cannot be used
  if (row.status === USER_STATUS.SUSPENDED) {
    await audit(req, 'LOGIN_BLOCKED_SUSPENDED', { actor: user })
    // A worker who was declined is told why (the reason the cooperative admin wrote)
    const note = row.role === ROLES.WORKER ? (await workers.findById(row.id))?.reviewNote : null
    throw ApiError.forbidden(note ? `Your account was not approved: ${note}` : 'This account is suspended')
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

// ── Emailed links: "set your password" (invitation) and "reset your password" ──

// POST /auth/setup-token/check: is this link still good? (so the page can say "expired" before asking for a password)
export const checkSetupToken = asyncHandler(async (req, res) => {
  const info = await authTokens.peek(hashToken(req.body.token))
  if (!info) throw ApiError.badRequest('This link has expired or was already used. Ask for a new one.')
  ok(res, { purpose: info.purpose, name: info.name, email: info.email })
})

// POST /auth/set-password: uses the link up, saves the new password and signs the person in
export const setPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST)

  let purpose
  const row = await withTransaction(async (client) => {
    const used = await authTokens.consume(hashToken(token), client) // only one request can ever win
    if (!used) throw ApiError.badRequest('This link has expired or was already used. Ask for a new one.')
    const target = await users.findById(used.user_id, client)
    if (!target || target.status === USER_STATUS.SUSPENDED) throw ApiError.badRequest('This link is no longer valid.')
    purpose = used.purpose
    const updated = await users.setPassword(target.id, passwordHash, client) // also ends the invitation and bumps token_version
    await refreshTokens.revokeAllForUser(target.id, client)
    return updated
  })

  const user = users.toPublicUser(row)
  await audit(req, purpose === 'invite' ? 'INVITE_ACCEPTED' : 'PASSWORD_RESET_DONE', { actor: user })
  if (purpose === 'invite') {
    await notifyPlatformAdmins({ type: 'admin.joined', title: 'Cooperative owner joined', body: `${user.name} accepted the invitation and set a password.`, link: '/platform/admins' })
  }
  const accessToken = await issueSession(row, req, res)
  ok(res, { user, accessToken })
})

// POST /auth/forgot-password: always answers the same, whether or not the email has an account
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  ok(res, { message: 'If an account exists for that email, we have sent a link.' })

  // The rest happens after the answer is sent, so the response time never gives the account away
  try {
    const row = await users.findByEmail(email)
    if (!row || row.status === USER_STATUS.SUSPENDED) return
    const purpose = row.invite_pending ? 'invite' : 'reset'
    if (await authTokens.createdWithin(row.id, purpose, 60)) return // at most one email a minute per person

    const minutes = purpose === 'invite' ? INVITE_HOURS * 60 : SELF_RESET_MINUTES
    const link = await createSetupLink(row.id, purpose, minutes)
    if (purpose === 'invite') {
      const coop = row.cooperative_id ? (await cooperatives.findById(row.cooperative_id))?.name : 'KaamGar'
      await sendMail({ to: row.email, ...inviteEmail({ name: row.name, email: row.email, cooperativeName: coop, invitedBy: 'The KaamGar team', link, hours: INVITE_HOURS }) })
    } else {
      await sendMail({ to: row.email, ...resetEmail({ name: row.name, link, minutes }) })
    }
    await audit(req, 'PASSWORD_LINK_SENT', { actor: users.toPublicUser(row), meta: { purpose } })
  } catch (err) {
    console.error('forgot-password follow-up failed:', err.message)
  }
})

