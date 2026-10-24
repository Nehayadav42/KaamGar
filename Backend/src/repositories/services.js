import { pool } from '../db/pool.js'

const run = (client) => client ?? pool

const toService = (r) =>
  r && {
    id: r.id,
    cooperativeId: r.cooperative_id,
    name: r.name,
    category: r.category,
    description: r.description,
    areas: r.areas,
    active: r.active,
    requires: r.requires,
    evidence: r.evidence,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }

export async function list({ cooperativeId, activeOnly = false }) {
  const { rows } = await pool.query(
    `SELECT * FROM services WHERE cooperative_id = $1 ${activeOnly ? 'AND active' : ''} ORDER BY created_at, name`,
    [cooperativeId],
  )
  return rows.map(toService)
}

export async function findById(id, client) {
  const { rows } = await run(client).query('SELECT * FROM services WHERE id = $1', [id])
  return toService(rows[0])
}

export async function create({ cooperativeId, name, category, description, areas, requires, evidence, createdBy }, client) {
  const { rows } = await run(client).query(
    `INSERT INTO services (cooperative_id, name, category, description, areas, requires, evidence, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [cooperativeId, name, category, description, areas, JSON.stringify(requires), JSON.stringify(evidence), createdBy],
  )
  return toService(rows[0])
}

export async function update(id, { name, category, description, areas, requires, evidence }, client) {
  const { rows } = await run(client).query(
    `UPDATE services SET name = $2, category = $3, description = $4, areas = $5, requires = $6, evidence = $7
     WHERE id = $1 RETURNING *`,
    [id, name, category, description, areas, JSON.stringify(requires), JSON.stringify(evidence)],
  )
  return toService(rows[0])
}

export async function setActive(id, active, client) {
  const { rows } = await run(client).query('UPDATE services SET active = $2 WHERE id = $1 RETURNING *', [id, active])
  return toService(rows[0])
}

export const addActivity = (serviceId, text, actorId, client) =>
  run(client).query('INSERT INTO service_activity (service_id, text, actor_id) VALUES ($1, $2, $3)', [serviceId, text, actorId ?? null])

export async function listActivity(serviceId) {
  const { rows } = await pool.query(
    'SELECT text, created_at FROM service_activity WHERE service_id = $1 ORDER BY created_at DESC, id DESC',
    [serviceId],
  )
  return rows.map((r) => ({ text: r.text, at: r.created_at }))
}

// How many of these ids really are services of this cooperative (used to validate worker skills)
export async function countInCoop(ids, cooperativeId) {
  if (!ids.length) return 0
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM services WHERE cooperative_id = $1 AND id = ANY($2::uuid[])', [cooperativeId, ids])
  return rows[0].n
}
