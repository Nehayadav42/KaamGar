import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './pool.js'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')

// Which migration files in db/migrations have NOT been applied to this database yet
export async function pendingMigrations() {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
  let applied = new Set()
  try {
    applied = new Set((await pool.query('SELECT filename FROM schema_migrations')).rows.map((r) => r.filename))
  } catch (err) {
    if (err.code !== '42P01') throw err // 42P01 = the tracking table does not exist yet, so nothing is applied
  }
  return files.filter((f) => !applied.has(f))
}
