import { pool } from '../db/pool.js'

const run = (client) => client ?? pool

// One booking with the extra names the screens need
const SELECT = `
  SELECT b.*,
         to_char(b.preferred_date, 'YYYY-MM-DD') AS date,
         to_char(b.preferred_time, 'HH24:MI') AS time,
         cu.name AS customer_name,
         c.name AS cooperative_name,
         w.name AS worker_name,
         COALESCE((SELECT array_agg(s.name ORDER BY s.name)
                   FROM worker_profiles wp JOIN services s ON s.id = ANY(wp.service_ids)
                   WHERE wp.user_id = b.worker_id), '{}') AS worker_skills
  FROM bookings b
  JOIN users cu ON cu.id = b.customer_id
  JOIN cooperatives c ON c.id = b.cooperative_id
  LEFT JOIN users w ON w.id = b.worker_id`

// withContact: only the cooperative's staff need the customer's phone number
function toBooking(r, { withContact = false } = {}) {
  return {
    id: r.id,
    ref: r.ref,
    cooperativeId: r.cooperative_id,
    serviceId: r.service_id,
    service: r.service_name,
    details: r.details,
    address: r.address,
    date: r.date,
    time: r.time,
    status: r.status,
    verification: r.verification,
    confirmation: r.confirmation,
    customerName: r.customer_name,
    ...(withContact ? { contact: r.contact } : {}),
    worker: r.worker_id ? { id: r.worker_id, name: r.worker_name, skills: r.worker_skills, cooperative: r.cooperative_name } : null,
    review: r.review_rating ? { rating: r.review_rating, comment: r.review_comment } : null,
    completedAt: r.completed_at,
    createdAt: r.created_at,
  }
}

// scope: { customerId } | { cooperativeId } | { workerId } | {} (everything)
function scopeSql(scope, params, startAt = 1) {
  const where = []
  let n = startAt
  for (const [key, col] of [['customerId', 'b.customer_id'], ['cooperativeId', 'b.cooperative_id'], ['workerId', 'b.worker_id']]) {
    if (scope[key]) { params.push(scope[key]); where.push(`${col} = $${n++}`) }
  }
  return where
}

export async function getEvents(bookingId) {
  const { rows } = await pool.query('SELECT label, status, created_at FROM booking_events WHERE booking_id = $1 ORDER BY id', [bookingId])
  return rows.map((e) => ({ label: e.label, status: e.status, at: e.created_at }))
}

export async function addEvent(bookingId, label, status, actorId, client) {
  await run(client).query('INSERT INTO booking_events (booking_id, label, status, actor_id) VALUES ($1, $2, $3, $4)', [bookingId, label, status, actorId ?? null])
}

export async function create(b, client) {
  const { rows } = await client.query(
    `INSERT INTO bookings (customer_id, cooperative_id, service_id, service_name, details, address, preferred_date, preferred_time, contact)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [b.customerId, b.cooperativeId, b.serviceId, b.serviceName, b.details ?? null, b.address ?? null, b.date ?? null, b.time ?? null, b.contact],
  )
  await addEvent(rows[0].id, 'Booking requested', 'PENDING', b.customerId, client)
  return rows[0].id
}

// One booking inside a scope. Returns null when it is not in that scope (so callers answer 404).
export async function findOne(id, scope, { withContact = false, withHistory = false } = {}) {
  const params = [id]
  const where = ['b.id = $1', ...scopeSql(scope, params, 2)]
  const { rows } = await pool.query(`${SELECT} WHERE ${where.join(' AND ')}`, params)
  if (!rows[0]) return null
  const booking = toBooking(rows[0], { withContact })
  if (withHistory) booking.history = await getEvents(id)
  return booking
}

export async function list(scope, { status, verification, limit, offset }, { withContact = false } = {}) {
  const params = []
  const where = scopeSql(scope, params)
  if (status) { params.push(status); where.push(`b.status = $${params.length}`) }
  if (verification) { params.push(verification); where.push(`b.verification <> $${params.length}`) }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const [data, count] = await Promise.all([
    pool.query(`${SELECT} ${clause} ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]),
    pool.query(`SELECT count(*)::int AS total FROM bookings b ${clause}`, params),
  ])
  return { bookings: data.rows.map((r) => toBooking(r, { withContact })), total: count.rows[0].total }
}

// Locks the row until the transaction ends, so two admins cannot allocate the same booking at once
export async function lockById(id, client) {
  const { rows } = await client.query('SELECT * FROM bookings WHERE id = $1 FOR UPDATE', [id])
  return rows[0] ?? null
}

export const countPendingForCustomer = async (customerId) =>
  (await pool.query("SELECT count(*)::int AS n FROM bookings WHERE customer_id = $1 AND status = 'PENDING'", [customerId])).rows[0].n

export const allocate = (id, workerId, client) =>
  client.query("UPDATE bookings SET worker_id = $2, status = 'ASSIGNED' WHERE id = $1", [id, workerId])

export const setStatus = (id, status, client) => client.query('UPDATE bookings SET status = $2 WHERE id = $1', [id, status])

export const markCompleted = (id, client) =>
  client.query("UPDATE bookings SET status = 'COMPLETED', verification = 'AWAITING_REVIEW', completed_at = now() WHERE id = $1", [id])

export const confirm = (id, rating, comment, client) =>
  client.query("UPDATE bookings SET confirmation = 'CONFIRMED', review_rating = $2, review_comment = $3 WHERE id = $1", [id, rating ?? null, comment ?? null])

export async function overview(cooperativeId) {
  const params = cooperativeId ? [cooperativeId] : []
  const clause = cooperativeId ? 'WHERE cooperative_id = $1' : ''
  const { rows } = await pool.query(
    `SELECT
       count(*) FILTER (WHERE status = 'PENDING')::int AS to_allocate,
       count(*) FILTER (WHERE status = 'COMPLETED' AND verification <> 'REVIEWED')::int AS to_review,
       count(*) FILTER (WHERE status = 'COMPLETED'
                        AND (completed_at AT TIME ZONE 'Asia/Kolkata')::date = (now() AT TIME ZONE 'Asia/Kolkata')::date)::int AS completed_today,
       count(*) FILTER (WHERE status IN ('ASSIGNED','ACCEPTED','IN_PROGRESS','EVIDENCE_SUBMITTED'))::int AS in_progress,
       count(*) FILTER (WHERE status = 'COMPLETED' AND confirmation = 'PENDING')::int AS awaiting_confirmation
     FROM bookings ${clause}`,
    params,
  )
  const r = rows[0]
  return {
    toAllocate: r.to_allocate,
    toReview: r.to_review,
    completedToday: r.completed_today,
    inProgress: r.in_progress,
    awaitingConfirmation: r.awaiting_confirmation,
  }
}
