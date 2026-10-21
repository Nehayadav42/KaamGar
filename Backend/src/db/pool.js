import pg from 'pg'
import { env } from '../config/env.js'

const ssl = env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: env.DATABASE_SSL === 'true' }

// One shared connection pool for the whole app
export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000,
  statement_timeout: 15_000, // a runaway query is cancelled after 15 seconds
})

pool.on('error', (err) => console.error('Unexpected Postgres pool error:', err.message))

// ALWAYS pass user input as parameters: query('... WHERE email = $1', [email]).
// Never build SQL by joining strings with user input. That is what stops SQL injection.
export const query = (text, params) => pool.query(text, params)

// Runs several statements as one all-or-nothing unit
export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function connectDB() {
  await pool.query('SELECT 1')
  console.log('PostgreSQL connected')
}

export const closePool = () => pool.end()
