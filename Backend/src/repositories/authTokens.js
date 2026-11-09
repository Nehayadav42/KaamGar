import { pool } from '../db/pool.js'

const run = (client) => client ?? pool

// One live link per person and purpose: making a new one cancels the old one
export async function replace({ userId, purpose, tokenHash, expiresAt }, client) {
  await run(client).query('DELETE FROM auth_tokens WHERE user_id = $1 AND purpose = $2 AND used_at IS NULL', [userId, purpose])
  await run(client).query('INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at) VALUES ($1, $2, $3, $4)', [userId, purpose, tokenHash, expiresAt])
}

// Look without using it up (to show the "set your password" form, or "this link has expired")
export async function peek(tokenHash) {
  const { rows } = await pool.query(
    `SELECT t.purpose, u.name, u.email FROM auth_tokens t JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = $1 AND t.used_at IS NULL AND t.expires_at > now()`,
    [tokenHash],
  )
  return rows[0] ?? null
}

// Uses the link up. Only one request can ever win.
export async function consume(tokenHash, client) {
  const { rows } = await run(client).query(
    `UPDATE auth_tokens SET used_at = now()
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
     RETURNING id, user_id, purpose`,
    [tokenHash],
  )
  return rows[0] ?? null
}

// Stops an email flood: was a link for this person made in the last few seconds?
export async function createdWithin(userId, purpose, seconds) {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM auth_tokens WHERE user_id = $1 AND purpose = $2 AND created_at > now() - make_interval(secs => $3)`,
    [userId, purpose, seconds],
  )
  return rowCount > 0
}
