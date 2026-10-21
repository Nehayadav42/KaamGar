import bcrypt from 'bcryptjs'
import { ROLES, USER_STATUS } from '../constants/roles.js'
import { withTransaction } from '../db/pool.js'
import * as auditLogs from '../repositories/auditLogs.js'
import * as cooperatives from '../repositories/cooperatives.js'
import * as refreshTokens from '../repositories/refreshTokens.js'
import * as users from '../repositories/users.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { audit } from '../utils/audit.js'

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data })

// ── Cooperatives (platform admin) ───────────────────────────────
export const createCooperative = asyncHandler(async (req, res) => {
  const coop = await cooperatives.create({ ...req.body, createdBy: req.user.id })
  await audit(req, 'COOPERATIVE_CREATED', { targetType: 'Cooperative', targetId: coop.id })
  ok(res, { cooperative: coop }, 201)
})

export const listCooperatives = asyncHandler(async (_req, res) => {
  ok(res, { cooperatives: await cooperatives.listAll() })
})

// Public: lets a worker pick a cooperative while signing up (id + name + area only)
export const listPublicCooperatives = asyncHandler(async (_req, res) => {
  ok(res, { cooperatives: await cooperatives.listActivePublic() })
})

// ── Cooperative admins (platform admin only) ────────────────────
export const createCoopAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, phone, cooperativeId } = req.body
  const coop = await cooperatives.findActiveById(cooperativeId)
  if (!coop) throw ApiError.badRequest('Choose a valid cooperative')
  if (await users.emailExists(email)) throw ApiError.conflict('An account with this email already exists')

  const row = await users.create({
    name,
    email,
    phone,
    role: ROLES.COOP_ADMIN,
    status: USER_STATUS.ACTIVE,
    cooperativeId: coop.id,
    passwordHash: await bcrypt.hash(password, 12),
    mustChangePassword: true, // the platform admin chose the first password, so it must be replaced
  })
  await audit(req, 'COOP_ADMIN_CREATED', { targetType: 'User', targetId: row.id, meta: { cooperativeId: coop.id } })
  ok(res, { user: users.toPublicUser(row) }, 201)
})

// ── Users ───────────────────────────────────────────────────────
// Platform admin: everyone. Cooperative admin: only the workers of their own cooperative.
export const listUsers = asyncHandler(async (req, res) => {
  const { role, status, cooperativeId, search, page, limit } = req.query

  const filters =
    req.user.role === ROLES.COOP_ADMIN
      ? { role: ROLES.WORKER, cooperativeId: req.user.cooperativeId, status, search } // forced scope
      : { role, status, cooperativeId, search }

  const { users: rows, total } = await users.list({ ...filters, limit, offset: (page - 1) * limit })
  ok(res, { users: rows, page, limit, total })
})

// Approve / suspend / re-activate
export const updateUserStatus = asyncHandler(async (req, res) => {
  const target = await users.findById(req.params.id)
  if (!target) throw ApiError.notFound('User not found')

  // A cooperative admin may only manage workers of their own cooperative.
  // Anything else is reported as "not found" so other cooperatives' users are not revealed.
  if (req.user.role === ROLES.COOP_ADMIN) {
    const mine = target.role === ROLES.WORKER && target.cooperative_id === req.user.cooperativeId
    if (!mine) throw ApiError.notFound('User not found')
  }
  if (target.id === req.user.id) throw ApiError.forbidden('You cannot change your own status')
  if (target.role === ROLES.PLATFORM_ADMIN) throw ApiError.forbidden('Platform admin accounts cannot be changed here')

  const to = req.body.status
  if (target.status === to) throw ApiError.conflict(`User is already ${to}`)

  const suspending = to === USER_STATUS.SUSPENDED
  const updated = await withTransaction(async (client) => {
    // suspending also bumps token_version (kills access tokens) and revokes refresh tokens
    const u = await users.setStatus(target.id, to, suspending, client)
    if (suspending) await refreshTokens.revokeAllForUser(target.id, client)
    return u
  })

  await audit(req, 'USER_STATUS_CHANGED', {
    targetType: 'User',
    targetId: target.id,
    meta: { from: target.status, to },
  })
  ok(res, { user: users.toPublicUser(updated) })
})

// ── Audit log (platform admin) ──────────────────────────────────
export const listAuditLogs = asyncHandler(async (req, res) => {
  const { action, page, limit } = req.query
  const { logs, total } = await auditLogs.list({ action, limit, offset: (page - 1) * limit })
  ok(res, { logs, page, limit, total })
})
