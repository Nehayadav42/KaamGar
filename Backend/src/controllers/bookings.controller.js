import { ROLES } from '../constants/roles.js'
import { withTransaction } from '../db/pool.js'
import * as bookings from '../repositories/bookings.js'
import * as services from '../repositories/services.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { audit } from '../utils/audit.js'
import { todayIST } from '../utils/dates.js'

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data })
const MAX_PENDING_PER_CUSTOMER = 10

// Which bookings this person is allowed to see, decided by role (never by the request)
export const scopeFor = (user) => {
  switch (user.role) {
    case ROLES.CUSTOMER: return { customerId: user.id }
    case ROLES.WORKER: return { workerId: user.id }
    case ROLES.COOP_ADMIN: return { cooperativeId: user.cooperativeId }
    default: return {} // platform admin
  }
}

// POST /bookings (customer)
export const createBooking = asyncHandler(async (req, res) => {
  const { serviceId, details, address, date, time, contact } = req.body

  const service = await services.findById(serviceId)
  if (!service || !service.active) throw ApiError.badRequest('Choose an available service')

  // The service decides what the customer must provide
  const issues = []
  if (service.requires.details && !details) issues.push({ field: 'details', message: 'Please describe the job in a few words' })
  if (service.requires.address && !address) issues.push({ field: 'address', message: 'Please add the full address, including your area' })
  if (service.requires.schedule && (!date || !time)) issues.push({ field: 'date', message: 'Choose a preferred date and time' })
  if (Boolean(date) !== Boolean(time)) issues.push({ field: 'time', message: 'Give both a date and a time, or neither' })
  if (date && date < todayIST()) issues.push({ field: 'date', message: 'Choose today or a later date' })
  if (issues.length) throw ApiError.badRequest('Validation failed', issues)

  if ((await bookings.countPendingForCustomer(req.user.id)) >= MAX_PENDING_PER_CUSTOMER) {
    throw ApiError.conflict(`You already have ${MAX_PENDING_PER_CUSTOMER} pending bookings. Please wait for them to be allocated.`)
  }

  const id = await withTransaction((client) =>
    bookings.create(
      { customerId: req.user.id, cooperativeId: service.cooperativeId, serviceId: service.id, serviceName: service.name, details, address, date, time, contact },
      client,
    ),
  )
  await audit(req, 'BOOKING_CREATED', { targetType: 'Booking', targetId: id })
  const booking = await bookings.findOne(id, { customerId: req.user.id }, { withContact: true, withHistory: true })
  ok(res, { booking }, 201)
})

// GET /bookings (customer: their own)
export const listMine = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query
  const { bookings: rows, total } = await bookings.list({ customerId: req.user.id }, { status, limit, offset: (page - 1) * limit }, { withContact: true })
  ok(res, { bookings: rows, page, limit, total })
})

// GET /bookings/:id (anyone allowed to see it; everyone else gets 404)
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookings.findOne(req.params.id, scopeFor(req.user), { withContact: true, withHistory: true })
  if (!booking) throw ApiError.notFound('Booking not found')
  ok(res, { booking })
})

// POST /bookings/:id/confirm (the customer says the work is finished, with an optional review)
export const confirmCompletion = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body
  await withTransaction(async (client) => {
    const row = await bookings.lockById(req.params.id, client)
    if (!row || row.customer_id !== req.user.id) throw ApiError.notFound('Booking not found')
    if (row.status !== 'COMPLETED') throw ApiError.conflict('You can confirm once the job is marked COMPLETED')
    if (row.confirmation === 'CONFIRMED') throw ApiError.conflict('You have already confirmed this job')
    await bookings.confirm(row.id, rating, comment, client)
    await bookings.addEvent(row.id, 'Customer confirmed completion', 'COMPLETED', req.user.id, client)
  })
  await audit(req, 'BOOKING_CONFIRMED', { targetType: 'Booking', targetId: req.params.id, meta: { rated: Boolean(rating) } })
  const booking = await bookings.findOne(req.params.id, { customerId: req.user.id }, { withContact: true, withHistory: true })
  ok(res, { booking })
})
