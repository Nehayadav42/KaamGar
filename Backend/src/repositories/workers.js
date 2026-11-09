import { pool } from '../db/pool.js'

const run = (client) => client ?? pool

const toWorker = (r) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  status: r.status,
  cooperativeId: r.cooperative_id,
  serviceIds: r.service_ids,
  skills: r.skills,
  areas: r.areas,
  availability: r.availability,
  note: r.note,
  verified: r.verified,
  shramikCardNumber: r.shramik_card_number,
  reviewNote: r.review_note,
  reviewedAt: r.reviewed_at,
  details: r.verified ? 'Cooperative-reviewed' : 'Self-declared',
  createdAt: r.created_at,
})

const SELECT = `
  SELECT u.id, u.name, u.email, u.phone, u.status, u.cooperative_id, u.created_at,
         COALESCE(wp.service_ids, '{}') AS service_ids,
         COALESCE((SELECT array_agg(s.name ORDER BY s.name) FROM services s WHERE s.id = ANY(wp.service_ids)), '{}') AS skills,
         COALESCE(wp.areas, '{}') AS areas,
         COALESCE(wp.availability, 'Available') AS availability,
         wp.note, COALESCE(wp.verified, false) AS verified,
         wp.shramik_card_number, wp.review_note, wp.reviewed_at
  FROM users u LEFT JOIN worker_profiles wp ON wp.user_id = u.id`

export const createEmptyProfile = (userId, client) =>
  run(client).query('INSERT INTO worker_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId])

// The details a worker gives when signing up
export const createProfile = (userId, { serviceIds, areas, shramikCardNumber }, client) =>
  run(client).query(
    'INSERT INTO worker_profiles (user_id, service_ids, areas, shramik_card_number) VALUES ($1, $2, $3, $4)',
    [userId, serviceIds, areas, shramikCardNumber],
  )

// Is this Shramik card number already used? (spaces, dashes and capitals are ignored)
export async function cardExists(card, client, exceptUserId = null) {
  const { rowCount } = await run(client).query(
    `SELECT 1 FROM worker_profiles
     WHERE lower(regexp_replace(shramik_card_number, '[^A-Za-z0-9]', '', 'g')) = lower(regexp_replace($1, '[^A-Za-z0-9]', '', 'g'))
       AND ($2::uuid IS NULL OR user_id <> $2)`,
    [card, exceptUserId],
  )
  return rowCount > 0
}

// cooperativeId = null means "all cooperatives" (platform admin)
export async function list({ cooperativeId, status }) {
  const params = []
  const where = ["u.role = 'worker'"]
  if (cooperativeId) { params.push(cooperativeId); where.push(`u.cooperative_id = $${params.length}`) }
  if (status) { params.push(status); where.push(`u.status = $${params.length}`) }
  const { rows } = await pool.query(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY u.created_at`, params)
  return rows.map(toWorker)
}

export async function findById(id) {
  const { rows } = await pool.query(`${SELECT} WHERE u.id = $1 AND u.role = 'worker'`, [id])
  return rows[0] ? toWorker(rows[0]) : null
}

export async function upsertProfile(userId, { serviceIds, areas, availability, note, verified, shramikCardNumber }, client) {
  await run(client).query(
    `INSERT INTO worker_profiles (user_id, service_ids, areas, availability, note, verified, shramik_card_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id) DO UPDATE SET service_ids = $2, areas = $3, availability = $4, note = $5, verified = $6,
       shramik_card_number = COALESCE($7, worker_profiles.shramik_card_number)`,
    [userId, serviceIds, areas, availability, note ?? null, verified, shramikCardNumber ?? null],
  )
}

// Records who reviewed the worker and why (used by approve and decline)
export const markReviewed = (userId, reviewerId, note, client) =>
  run(client).query('UPDATE worker_profiles SET reviewed_by = $2, reviewed_at = now(), review_note = $3 WHERE user_id = $1', [userId, reviewerId, note ?? null])

// Active, available workers of this cooperative who can do this service
export async function eligibleFor(serviceId, cooperativeId, client) {
  const { rows } = await run(client).query(
    `${SELECT}
     WHERE u.role = 'worker' AND u.status = 'active' AND u.cooperative_id = $1
       AND wp.availability <> 'Unavailable' AND $2::uuid = ANY(wp.service_ids)
     ORDER BY u.name`,
    [cooperativeId, serviceId],
  )
  return rows.map(toWorker)
}
