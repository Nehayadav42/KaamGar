import * as bookings from '../repositories/bookings.js'
import { ApiError } from './ApiError.js'
import { notify, notifyCoopAdmins } from './notify.js'

// The forward path of a booking once a worker is assigned
const FORWARD = {
  ASSIGNED: { to: 'ACCEPTED', label: 'Worker accepted' },
  ACCEPTED: { to: 'IN_PROGRESS', label: 'Work started' },
  IN_PROGRESS: { to: 'COMPLETED', label: 'Work completed' },
}

// Moves a (locked) booking one step forward and records it in its timeline.
// The same step is used by the worker and, on the worker's behalf, by the cooperative admin.
export async function moveForward(client, row, actorId) {
  const step = FORWARD[row.status]
  if (!step) throw ApiError.conflict(`A ${row.status} booking cannot be moved forward`)
  if (step.to === 'COMPLETED') await bookings.markCompleted(row.id, client)
  else await bookings.setStatus(row.id, step.to, client)
  await bookings.addEvent(row.id, step.label, step.to, actorId, client)
  return step.to
}

// Takes the worker off and puts the booking back in the queue
export async function sendBackToQueue(client, row, actorId) {
  await bookings.unassign(row.id, client)
  await bookings.addEvent(row.id, 'Reassigning to another worker', 'PENDING', actorId, client)
}

// Tells the right people about a step (call after the transaction has been saved)
export async function notifyStep(row, to, workerName) {
  const link = `/customer/bookings/${row.id}`
  if (to === 'ACCEPTED') {
    await notify(row.customer_id, { type: 'booking.accepted', title: 'Your worker confirmed', body: `${workerName} will do your ${row.service_name}.`, link })
  } else if (to === 'IN_PROGRESS') {
    await notify(row.customer_id, { type: 'booking.started', title: 'Work has started', body: `${workerName} has started your ${row.service_name}.`, link })
  } else if (to === 'COMPLETED') {
    await notify(row.customer_id, { type: 'booking.completed', title: 'Work is complete', body: `Please confirm that your ${row.service_name} is done.`, link })
    await notifyCoopAdmins(row.cooperative_id, { type: 'booking.review', title: 'Work completed', body: `${row.ref} · ${row.service_name} is finished and waiting for review.`, link: '/admin/bookings' })
  }
}
