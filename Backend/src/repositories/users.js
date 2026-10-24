import { pool } from '../db/pool.js'

// All SQL for the "users" table lives here. Every value goes in as a $n parameter.
const run = (client) => client ?? pool

// What is safe to send to a browser. password_hash, token_version and lock data never leave the server.
export const toPublicUser = (r) =>
  r && {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    status: r.status,
    cooperativeId: r.cooperative_id,
    mustChangePassword: r.must_change_password,
    lastLoginAt: r.last_login_at,
    passwordChangedAt: r.password_changed_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }

// Escapes % _ and \ so a search for "50%" is treated as text, not a wildcard
const escapeLike = (s) => s.replace(/[\\%_]/g, '\\$&')

export async function findById(id, client) {
  const { rows } = await run(client).query('SELECT * FROM users WHERE id = $1', [id])
  return rows[0] ?? null
}

// Includes password_hash and lock info: only the login flow should call this
export async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email])
  return rows[0] ?? null
}

export async function emailExists(email) {
  const { rowCount } = await pool.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email])
  return rowCount > 0
}

export async function create({ name, email, phone, role, passwordHash, status, cooperativeId, mustChangePassword = false }, client) {
  const { rows } = await run(client).query(
    `INSERT INTO users (name, email, phone, role, password_hash, status, cooperative_id, must_change_password)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [name, email, phone ?? null, role, passwordHash, status, cooperativeId ?? null, mustChangePassword],
  )
  return rows[0]
}

// Counts a wrong password and locks the account when the limit is reached.
// One atomic statement, so parallel guesses cannot dodge the counter.
export async function recordFailedLogin(id, maxAttempts, lockMinutes) {
  const { rows } = await pool.query(
    `UPDATE users SET
       failed_login_attempts = CASE WHEN failed_login_attempts + 1 >= $2 THEN 0 ELSE failed_login_attempts + 1 END,
       lock_until = CASE WHEN failed_login_attempts + 1 >= $2 THEN now() + make_interval(mins => $3) ELSE lock_until END
     WHERE id = $1
     RETURNING (failed_login_attempts = 0 AND lock_until > now()) AS locked`,
    [id, maxAttempts, lockMinutes],
  )
  return { locked: Boolean(rows[0]?.locked) }
}

export const recordSuccessfulLogin = (id) =>
  pool.query('UPDATE users SET failed_login_attempts = 0, lock_until = NULL, last_login_at = now() WHERE id = $1', [id])

// bumpTokens = true also invalidates every access token the user holds right now
export async function setStatus(id, status, bumpTokens, client) {
  const { rows } = await run(client).query(
    'UPDATE users SET status = $2, token_version = token_version + $3 WHERE id = $1 RETURNING *',
    [id, status, bumpTokens ? 1 : 0],
  )
  return rows[0] ?? null
}

export const bumpTokenVersion = (id, client) =>
  run(client).query('UPDATE users SET token_version = token_version + 1 WHERE id = $1', [id])

export async function setPassword(id, passwordHash, client) {
  const { rows } = await run(client).query(
    `UPDATE users SET password_hash = $2, password_changed_at = now(), must_change_password = false,
            token_version = token_version + 1
     WHERE id = $1 RETURNING *`,
    [id, passwordHash],
  )
  return rows[0]
}

// Filtered, paginated list. Column names are fixed in code; only values are parameters.
export async function list({ role, status, cooperativeId, search, limit, offset }) {
  const where = []
  const params = []
  const add = (sql, value) => {
    params.push(value)
    where.push(sql.replace('?', `$${params.length}`))
  }

  if (role) add('role = ?', role)
  if (status) add('status = ?', status)
  if (cooperativeId) add('cooperative_id = ?', cooperativeId)
  if (search) {
    params.push(`%${escapeLike(search)}%`)
    const n = params.length
    where.push(`(name ILIKE $${n} ESCAPE '\\' OR email ILIKE $${n} ESCAPE '\\')`)
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const [data, count] = await Promise.all([
    pool.query(
      `SELECT * FROM users ${clause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
    pool.query(`SELECT count(*)::int AS total FROM users ${clause}`, params),
  ])
  return { users: data.rows.map(toPublicUser), total: count.rows[0].total }
}
