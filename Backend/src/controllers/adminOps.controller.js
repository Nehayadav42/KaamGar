import { ROLES, USER_STATUS } from '../constants/roles.js'
import { withTransaction } from '../db/pool.js'
import * as bookings from '../repositories/bookings.js'
import * as refreshTokens from '../repositories/refreshTokens.js'
import * as services from '../repositories/services.js'
import * as users from '../repositories/users.js'
import * as workers from '../repositories/workers.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { audit } from '../utils/audit.js'
import { moveForward, notifyStep, sendBackToQueue } from '../utils/bookingFlow.js'
import { notify } from '../utils/notify.js'
import { adminBookingScope, canManage } from '../utils/scope.js'

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data })

// ── Overview ─────────────────────────────────────────────────────
export const overview = asyncHandler(async (req, res) => {
  const scope = adminBookingScope(req.user)
  const [counts, pending, toReview, waitingWorkers] = await Promise.all([
    bookings.overview(scope.cooperativeId),
    bookings.list(scope, { status: ['PENDING'], limit: 5, offset: 0 }, { withContact: true }),
    bookings.list(scope, { status: ['COMPLETED'], verification: 'REVIEWED', limit: 5, offset: 0 }, { withContact: true }),
    workers.list({ cooperativeId: req.user.role === ROLES.COOP_ADMIN ? req.user.cooperativeId : null, status: USER_STATUS.PENDING }),
  ])
  ok(res, {
    counts: { ...counts, workersToApprove: waitingWorkers.length },
    attention: { toAllocate: pending.bookings, toReview: toReview.bookings, workersToApprove: waitingWorkers.slice(0, 5) },
  })
})

// ── Bookings ─────────────────────────────────────────────────────
export const listBookings = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query
  const { bookings: rows, total } = await bookings.list(adminBookingScope(req.user), { status, limit, offset: (page - 1) * limit }, { withContact: true })
  ok(res, { bookings: rows, page, limit, total })
})

async function bookingInScope(req) {
  const booking = await bookings.findOne(req.params.id, adminBookingScope(req.user), { withContact: true })
  if (!booking) throw ApiError.notFound('Booking not found')
  return booking
}

export const eligibleWorkers = asyncHandler(async (req, res) => {
  const booking = await bookingInScope(req)
  ok(res, { workers: await workers.eligibleFor(booking.serviceId, booking.cooperativeId) })
})

export const allocate = asyncHandler(async (req, res) => {
  const { workerId } = req.body
  let row, worker
  await withTransaction(async (client) => {
    row = await bookings.lockById(req.params.id, client) // stops two admins allocating at once
    if (!row || !canManage(req.user, row.cooperative_id)) throw ApiError.notFound('Booking not found')
    if (row.status !== 'PENDING') throw ApiError.conflict('Only pending bookings can be allocated')

    const eligible = await workers.eligibleFor(row.service_id, row.cooperative_id, client)
    worker = eligible.find((w) => w.id === workerId)
    if (!worker) throw ApiError.badRequest('This worker is not available for this booking')

    await bookings.allocate(row.id, workerId, client)
    await bookings.addEvent(row.id, 'Worker allocated', 'ASSIGNED', req.user.id, client)
  })
  await audit(req, 'BOOKING_ALLOCATED', { targetType: 'Booking', targetId: req.params.id, meta: { workerId } })
  await notify(workerId, { type: 'job.offered', title: 'New job for you', body: `${row.service_name} · ${row.address ?? 'address on the job'}. Open it to accept.`, link: '/worker' })
  await notify(row.customer_id, { type: 'booking.assigned', title: 'A worker was assigned', body: `${worker.name} is assigned to your ${row.service_name}. They will confirm shortly.`, link: `/customer/bookings/${row.id}` })
  ok(res, { booking: await bookings.findOne(req.params.id, adminBookingScope(req.user), { withContact: true, withHistory: true }) })
})

// Moves the job one step on the worker's behalf (for a worker who cannot use the app)
export const advance = asyncHandler(async (req, res) => {
  let row, to
  await withTransaction(async (client) => {
    row = await bookings.lockById(req.params.id, client)
    if (!row || !canManage(req.user, row.cooperative_id)) throw ApiError.notFound('Booking not found')
    to = await moveForward(client, row, req.user.id)
  })
  const worker = row.worker_id ? await users.findById(row.worker_id) : null
  await audit(req, 'BOOKING_ADVANCED', { targetType: 'Booking', targetId: req.params.id, meta: { to } })
  await notifyStep(row, to, worker?.name ?? 'Your worker')
  ok(res, { booking: await bookings.findOne(req.params.id, adminBookingScope(req.user), { withContact: true, withHistory: true }) })
})

// Takes the worker off a booking that has not started, so it can be given to someone else
export const unassign = asyncHandler(async (req, res) => {
  let row
  await withTransaction(async (client) => {
    row = await bookings.lockById(req.params.id, client)
    if (!row || !canManage(req.user, row.cooperative_id)) throw ApiError.notFound('Booking not found')
    if (!['ASSIGNED', 'ACCEPTED'].includes(row.status)) throw ApiError.conflict('Only a booking that has not started can be taken back')
    await sendBackToQueue(client, row, req.user.id)
  })
  await audit(req, 'BOOKING_UNASSIGNED', { targetType: 'Booking', targetId: req.params.id })
  await notify(row.worker_id, { type: 'job.taken_back', title: 'A job was taken back', body: `${row.ref} · ${row.service_name} was given to someone else.`, link: '/worker' })
  ok(res, { booking: await bookings.findOne(req.params.id, adminBookingScope(req.user), { withContact: true, withHistory: true }) })
})

// ── Workers ──────────────────────────────────────────────────────
export const listWorkers = asyncHandler(async (req, res) => {
  const cooperativeId = req.user.role === ROLES.COOP_ADMIN ? req.user.cooperativeId : null
  ok(res, { workers: await workers.list({ cooperativeId }) })
})

async function managedWorker(req) {
  const worker = await workers.findById(req.params.id)
  if (!worker || !canManage(req.user, worker.cooperativeId)) throw ApiError.notFound('Worker not found')
  return worker
}

async function checkProfile(worker, body) {
  if ((await services.countInCoop(body.serviceIds, worker.cooperativeId)) !== body.serviceIds.length) {
    throw ApiError.badRequest('One or more services do not exist in this cooperative')
  }
  if (body.shramikCardNumber && (await workers.cardExists(body.shramikCardNumber, undefined, worker.id))) {
    throw ApiError.conflict('This Shramik card number belongs to another worker')
  }
}

export const updateWorkerProfile = asyncHandler(async (req, res) => {
  const worker = await managedWorker(req)
  await checkProfile(worker, req.body)
  await workers.upsertProfile(worker.id, req.body)
  await audit(req, 'WORKER_PROFILE_UPDATED', { targetType: 'User', targetId: worker.id })
  ok(res, { worker: await workers.findById(worker.id) })
})

// Approve a new worker. The reviewer may correct the details first.
export const approveWorker = asyncHandler(async (req, res) => {
  const worker = await managedWorker(req)
  if (worker.status !== USER_STATUS.PENDING) throw ApiError.conflict('Only workers waiting for approval can be approved')
  await checkProfile(worker, req.body)

  await withTransaction(async (client) => {
    await users.setStatus(worker.id, USER_STATUS.ACTIVE, false, client)
    await workers.upsertProfile(worker.id, { ...req.body, verified: true }, client) // approved = "Cooperative-reviewed"
    await workers.markReviewed(worker.id, req.user.id, null, client)
  })
  await audit(req, 'WORKER_APPROVED', { targetType: 'User', targetId: worker.id })
  await notify(worker.id, { type: 'account.approved', title: 'Your account is approved', body: 'Your cooperative approved you. You can now receive jobs.', link: '/worker' })
  ok(res, { worker: await workers.findById(worker.id) })
})

export const declineWorker = asyncHandler(async (req, res) => {
  const worker = await managedWorker(req)
  if (worker.status !== USER_STATUS.PENDING) throw ApiError.conflict('Only workers waiting for approval can be declined')

  await withTransaction(async (client) => {
    await users.setStatus(worker.id, USER_STATUS.SUSPENDED, true, client)
    await refreshTokens.revokeAllForUser(worker.id, client)
    await workers.markReviewed(worker.id, req.user.id, req.body.reason, client)
  })
  await audit(req, 'WORKER_DECLINED', { targetType: 'User', targetId: worker.id })
  await notify(worker.id, { type: 'account.declined', title: 'Your account was not approved', body: req.body.reason, link: '/worker' })
  ok(res, { worker: await workers.findById(worker.id) })
})
