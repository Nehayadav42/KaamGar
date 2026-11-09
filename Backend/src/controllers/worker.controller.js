import { withTransaction } from '../db/pool.js'
import * as bookings from '../repositories/bookings.js'
import * as workers from '../repositories/workers.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { audit } from '../utils/audit.js'
import { moveForward, notifyStep, sendBackToQueue } from '../utils/bookingFlow.js'
import { notifyCoopAdmins } from '../utils/notify.js'

const ok = (res, data) => res.json({ success: true, data })

// The customer's phone number is shared with the worker only once the worker has accepted the job
const forWorker = (b) => {
  if (b.status === 'ASSIGNED') delete b.contact
  return b
}

// GET /worker/profile: the worker's own submitted details and review state (works while still pending)
export const getProfile = asyncHandler(async (req, res) => {
  const worker = await workers.findById(req.user.id)
  ok(res, { worker })
})

// GET /worker/jobs
export const listJobs = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query
  const { bookings: rows, total } = await bookings.list({ workerId: req.user.id }, { status, limit, offset: (page - 1) * limit }, { withContact: true })
  ok(res, { jobs: rows.map(forWorker), page, limit, total })
})

// GET /worker/jobs/:id
export const getJob = asyncHandler(async (req, res) => {
  const job = await bookings.findOne(req.params.id, { workerId: req.user.id }, { withContact: true, withHistory: true })
  if (!job) throw ApiError.notFound('Job not found')
  ok(res, { job: forWorker(job) })
})

// Locks the booking and makes sure it really is this worker's, in the status the action needs
async function lockMine(client, req, allowed) {
  const row = await bookings.lockById(req.params.id, client)
  if (!row || row.worker_id !== req.user.id) throw ApiError.notFound('Job not found')
  if (!allowed.includes(row.status)) throw ApiError.conflict(`This job is ${row.status.toLowerCase().replace('_', ' ')}, so you cannot do that now`)
  return row
}

const respond = async (req, res) =>
  ok(res, { job: forWorker(await bookings.findOne(req.params.id, { workerId: req.user.id }, { withContact: true, withHistory: true })) })

// One handler for accept / start / finish: each needs a specific current status
const step = (action, requiredStatus) =>
  asyncHandler(async (req, res) => {
    let row, to
    await withTransaction(async (client) => {
      row = await lockMine(client, req, [requiredStatus])
      to = await moveForward(client, row, req.user.id)
    })
    await audit(req, `JOB_${action}`, { targetType: 'Booking', targetId: row.id })
    await notifyStep(row, to, req.user.name)
    await respond(req, res)
  })

export const accept = step('ACCEPTED', 'ASSIGNED')
export const start = step('STARTED', 'ACCEPTED')
export const finish = step('FINISHED', 'IN_PROGRESS')

// POST /worker/jobs/:id/decline: gives the job back so the cooperative can choose someone else
export const decline = asyncHandler(async (req, res) => {
  let row
  await withTransaction(async (client) => {
    row = await lockMine(client, req, ['ASSIGNED', 'ACCEPTED'])
    await sendBackToQueue(client, row, req.user.id)
  })
  await audit(req, 'JOB_DECLINED', { targetType: 'Booking', targetId: row.id })
  await notifyCoopAdmins(row.cooperative_id, {
    type: 'job.declined',
    title: 'A worker gave a job back',
    body: `${req.user.name} declined ${row.ref} · ${row.service_name}${req.body.reason ? `: ${req.body.reason}` : ''}. It needs a new worker.`,
    link: '/admin/bookings',
  })
  ok(res, { message: 'The job was given back to the cooperative' })
})
