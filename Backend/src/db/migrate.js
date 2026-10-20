import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { closePool, pool } from './pool.js'

// Applies every .sql file in ./migrations once, in filename order.
//   npm run migrate
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')

await pool.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`)

const done = new Set((await pool.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename))
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()

let applied = 0
for (const file of files) {
  if (done.has(file)) continue
  const sql = fs.readFileSync(path.join(dir, file), 'utf8')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file])
    await client.query('COMMIT')
    console.log(`applied ${file}`)
    applied += 1
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(`FAILED ${file}: ${err.message}`)
    process.exitCode = 1
    break
  } finally {
    client.release()
  }
}
if (!applied && !process.exitCode) console.log('Database is up to date')
await closePool()
