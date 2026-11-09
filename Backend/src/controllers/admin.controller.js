import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { env } from '../config/env.js'
import { ROLES, USER_STATUS } from '../constants/roles.js'
import { withTransaction } from '../db/pool.js'
import * as auditLogs from '../repositories/auditLogs.js'
import * as cooperatives from '../repositories/cooperatives.js'
import * as refreshTokens from '../repositories/refreshTokens.js'
import * as stats from '../repositories/stats.js'
import * as users from '../repositories/users.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { audit } from '../utils/audit.js'
import { inviteEmail, resetEmail } from '../utils/emailTemplates.js'
import { sendMail } from '../utils/mailer.js'
import { notify } from '../utils/notify.js'
import { ADMIN_RESET_HOURS, INVITE_HOURS, createSetupLink } from '../utils/setupLinks.js'

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data })

// In development the link can also come back in the response (handy for Postman). Never in production.
const devLink = (link) => (env.exposeDevLinks ? { devLink: link } : {})

// ── Platform overview ───────────────────────────────────────────
export const platformOverview = asyncHandler(async (_req, res) => {
  const [counts, recent] = await Promise.all([stats.platformOverview(), auditLogs.list({ limit: 6, offset: 0 })])
  ok(res, { counts, recent: recent.logs })
})

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
export const listCoopAdmins = asyncHandler(async (_req, res) => {
  ok(res, { admins: await users.listCoopAdmins() })
})

// POST /admin/coop-admins: invites someone. No password is set here: they choose it from an emailed link.
export const createCoopAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, cooperativeId } = req.body
  const coop = await cooperatives.findActiveById(cooperativeId)
  if (!coop) throw ApiError.badRequest('Choose a valid cooperative')
  if (await users.emailExists(email)) throw ApiError.conflict('An account with this email already exists')

  // A random password nobody knows: the account cannot be used until the invitation is accepted
  const placeholder = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12)
  const row = await users.create({
    name,
    email,
    phone,
    role: ROLES.COOP_ADMIN,
    status: USER_STATUS.ACTIVE,
    cooperativeId: coop.id,
    passwordHash: placeholder,
    invitePending: true,
  })

  const link = await createSetupLink(row.id, 'invite', INVITE_HOURS * 60)
  const mail = await sendMail({ to: row.email, ...inviteEmail({ name, email, cooperativeName: coop.name, invitedBy: req.user.name, link, hours: INVITE_HOURS }) })
  await audit(req, 'COOP_ADMIN_INVITED', { targetType: 'User', targetId: row.id, meta: { cooperativeId: coop.id, emailSent: mail.sent } })
  ok(res, { user: users.toPublicUser(row), emailSent: mail.sent, ...devLink(link) }, 201)
})

async function loadCoopAdmin(req) {
  const target = await users.findById(req.params.id)
  if (!target || target.role !== ROLES.COOP_ADMIN) throw ApiError.notFound('Cooperative admin not found')
  return target
}

// POST /admin/coop-admins/:id/resend-invite: a new link (the old one stops working)
export const resendInvite = asyncHandler(async (req, res) => {
  const target = await loadCoopAdmin(req)
  if (!target.invite_pending) throw ApiError.conflict('This person has already joined. Use "Reset password" instead.')
  const coop = await cooperatives.findById(target.cooperative_id)
  const link = await createSetupLink(target.id, 'invite', INVITE_HOURS * 60)
  const mail = await sendMail({ to: target.email, ...inviteEmail({ name: target.name, email: target.email, cooperativeName: coop.name, invitedBy: req.user.name, link, hours: INVITE_HOURS }) })
  await audit(req, 'COOP_ADMIN_INVITE_RESENT', { targetType: 'User', targetId: target.id })
  ok(res, { emailSent: mail.sent, ...devLink(link) })
})

// POST /admin/coop-admins/:id/reset-password: emails them a link to choose a new password
export const resetCoopAdminPassword = asyncHandler(async (req, res) => {
  const target = await loadCoopAdmin(req)
  if (target.invite_pending) throw ApiError.conflict('This person has not joined yet. Use "Resend invitation" instead.')
  const link = await createSetupLink(target.id, 'reset', ADMIN_RESET_HOURS * 60)
  const mail = await sendMail({ to: target.email, ...resetEmail({ name: target.name, link, minutes: ADMIN_RESET_HOURS * 60 }) })
  await audit(req, 'COOP_ADMIN_RESET_SENT', { targetType: 'User', targetId: target.id })
  ok(res, { emailSent: mail.sent, ...devLink(link) })
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

// Suspend / re-activate. (Approving a new worker has its own endpoint, with the review details.)
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
  if (target.status === USER_STATUS.PENDING) throw ApiError.conflict('This worker is waiting for review. Approve or decline them instead.')

  const suspending = to === USER_STATUS.SUSPENDED
  const updated = await withTransaction(async (client) => {
    // suspending also bumps token_version (kills access tokens) and revokes refresh tokens
    const u = await users.setStatus(target.id, to, suspending, client)
    if (suspending) await refreshTokens.revokeAllForUser(target.id, client)
    return u
  })

  await audit(req, 'USER_STATUS_CHANGED', { targetType: 'User', targetId: target.id, meta: { from: target.status, to } })
  if (target.role === ROLES.WORKER) {
    await notify(target.id, suspending
      ? { type: 'account.suspended', title: 'Your account was paused', body: 'Please contact your cooperative.', link: '/worker' }
      : { type: 'account.reactivated', title: 'Your account is active again', body: 'You can receive jobs again.', link: '/worker' })
  }
  ok(res, { user: users.toPublicUser(updated) })
})

// ── Audit log (platform admin) ──────────────────────────────────
export const listAuditLogs = asyncHandler(async (req, res) => {
  const { action, page, limit } = req.query
  const { logs, total } = await auditLogs.list({ action, limit, offset: (page - 1) * limit })
  ok(res, { logs, page, limit, total })
})
