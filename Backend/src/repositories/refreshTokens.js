import { pool } from '../db/pool.js'

const run = (client) => client ?? pool

export const create = ({ userId, tokenHash, familyId, expiresAt, userAgent, ip }) =>
  pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at, user_agent, ip)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [userId, tokenHash, familyId, expiresAt, userAgent, ip],
  )

// Atomically "uses up" a token: only one request can ever win. Returns the row, or null.
export async function consume(tokenHash) {
  const { rows } = await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now()
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()
     RETURNING *`,
    [tokenHash],
  )
  return rows[0] ?? null
}

export async function findByHash(tokenHash) {
  const { rows } = await pool.query('SELECT * FROM refresh_tokens WHERE token_hash = $1', [tokenHash])
  return rows[0] ?? null
}

export const revokeFamily = (familyId) =>
  pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = $1 AND revoked_at IS NULL', [familyId])

export const revokeAllForUser = (userId, client) =>
  run(client).query('UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [userId])

// Postgres has no automatic expiry, so old rows are swept now and then
export const purgeExpired = () =>
  pool.query("DELETE FROM refresh_tokens WHERE expires_at < now() - interval '1 day'")
