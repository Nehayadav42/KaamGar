import { pool } from '../db/pool.js'

const toCoop = (r) =>
  r && { id: r.id, name: r.name, area: r.area, active: r.active, createdAt: r.created_at, updatedAt: r.updated_at }

export async function create({ name, area, createdBy }) {
  const { rows } = await pool.query(
    'INSERT INTO cooperatives (name, area, created_by) VALUES ($1, $2, $3) RETURNING *',
    [name, area ?? null, createdBy ?? null],
  )
  return toCoop(rows[0])
}

export async function listAll() {
  const { rows } = await pool.query('SELECT * FROM cooperatives ORDER BY name')
  return rows.map(toCoop)
}

// Public: just enough for a worker to choose a cooperative while signing up
export async function listActivePublic() {
  const { rows } = await pool.query('SELECT id, name, area FROM cooperatives WHERE active ORDER BY name')
  return rows
}

export async function findActiveById(id) {
  const { rows } = await pool.query('SELECT * FROM cooperatives WHERE id = $1 AND active', [id])
  return toCoop(rows[0])
}

export async function findByName(name) {
  const { rows } = await pool.query('SELECT * FROM cooperatives WHERE lower(name) = lower($1)', [name])
  return toCoop(rows[0])
}

// The pilot runs on one cooperative: the oldest active one
export async function findDefault() {
  const { rows } = await pool.query('SELECT * FROM cooperatives WHERE active ORDER BY created_at LIMIT 1')
  return toCoop(rows[0])
}
