import { ROLES } from '../constants/roles.js'
import { withTransaction } from '../db/pool.js'
import * as bookings from '../repositories/bookings.js'
import * as services from '../repositories/services.js'
import * as workers from '../repositories/workers.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { audit } from '../utils/audit.js'
import { adminBookingScope, canManage } from '../utils/scope.js'

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data })

// ── Overview ─────────────────────────────────────────────────────
export const overview = asyncHandler(async (req, res) => {
  const scope = adminBookingScope(req.user)
  const [counts, pending, toReview] = await Promise.all([
    bookings.overview(scope.cooperativeId),
    bookings.list(scope, { status: 'PENDING', limit: 5, offset: 0 }, { withContact: true }),
    bookings.list(scope, { status: 'COMPLETED', verification: 'REVIEWED', limit: 5, offset: 0 }, { withContact: true }),
  ])
  ok(res, { counts, attention: { toAllocate: pending.bookings, toReview: toReview.bookings } })
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
  await withTransaction(async (client) => {
    const row = await bookings.lockById(req.params.id, client) // stops two admins allocating at once
    if (!row || !canManage(req.user, row.cooperative_id)) throw ApiError.notFound('Booking not found')
    if (row.status !== 'PENDING') throw ApiError.conflict('Only pending bookings can be allocated')

    const eligible = await workers.eligibleFor(row.service_id, row.cooperative_id, client)
    if (!eligible.some((w) => w.id === workerId)) {
      throw ApiError.badRequest('This worker is not available for this booking')
    }
    await bookings.allocate(row.id, workerId, client)
    await bookings.addEvent(row.id, 'Worker allocated', 'ASSIGNED', req.user.id, client)
  })
  await audit(req, 'BOOKING_ALLOCATED', { targetType: 'Booking', targetId: req.params.id, meta: { workerId } })
  ok(res, { booking: await bookings.findOne(req.params.id, adminBookingScope(req.user), { withContact: true, withHistory: true }) })
})

// ASSIGNED -> IN_PROGRESS -> COMPLETED. (Until the worker space exists, the cooperative moves the job along.)
export const advance = asyncHandler(async (req, res) => {
  let to
  await withTransaction(async (client) => {
    const row = await bookings.lockById(req.params.id, client)
    if (!row || !canManage(req.user, row.cooperative_id)) throw ApiError.notFound('Booking not found')
    if (row.status === 'ASSIGNED') {
      to = 'IN_PROGRESS'
      await bookings.setStatus(row.id, to, client)
      await bookings.addEvent(row.id, 'Work started', to, req.user.id, client)
    } else if (row.status === 'IN_PROGRESS') {
      to = 'COMPLETED'
      await bookings.markCompleted(row.id, client)
      await bookings.addEvent(row.id, 'Work completed', to, req.user.id, client)
    } else {
      throw ApiError.conflict(`A ${row.status} booking cannot be moved forward here`)
    }
  })
  await audit(req, 'BOOKING_ADVANCED', { targetType: 'Booking', targetId: req.params.id, meta: { to } })
  ok(res, { booking: await bookings.findOne(req.params.id, adminBookingScope(req.user), { withContact: true, withHistory: true }) })
})

// ── Workers ──────────────────────────────────────────────────────
export const listWorkers = asyncHandler(async (req, res) => {
  const cooperativeId = req.user.role === ROLES.COOP_ADMIN ? req.user.cooperativeId : null
  ok(res, { workers: await workers.list({ cooperativeId }) })
})

export const updateWorkerProfile = asyncHandler(async (req, res) => {
  const worker = await workers.findById(req.params.id)
  if (!worker || !canManage(req.user, worker.cooperativeId)) throw ApiError.notFound('Worker not found')

  const { serviceIds } = req.body
  if ((await services.countInCoop(serviceIds, worker.cooperativeId)) !== serviceIds.length) {
    throw ApiError.badRequest('One or more services do not exist in this cooperative')
  }
  const updated = await workers.upsertProfile(worker.id, req.body)
  await audit(req, 'WORKER_PROFILE_UPDATED', { targetType: 'User', targetId: worker.id })
  ok(res, { worker: updated })
})
