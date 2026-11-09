import app from './app.js'
import { env } from './config/env.js'
import { pendingMigrations } from './db/checkMigrations.js'
import { closePool, connectDB } from './db/pool.js'
import { purgeOld } from './repositories/notifications.js'
import { purgeExpired } from './repositories/refreshTokens.js'


await connectDB()

// Refuse to start when the database is older than the code. This used to show up as confusing
// "500 Internal Server Error" responses; now it stops here with a clear instruction.
const pending = await pendingMigrations()
if (pending.length) {
  console.error('\n✖ The database is behind the code. Pending migrations:')
  for (const f of pending) console.error(`    - ${f}`)
  console.error('\n  Run:  npm run migrate     (then, once:  npm run seed)\n')
  await closePool()
  process.exit(1)
}
const server = app.listen(env.PORT, () => console.log(`KaamGar API running on http://localhost:${env.PORT} (${env.NODE_ENV})`))

// Sweep expired refresh tokens at start-up and then every hour
const sweep = () => Promise.all([purgeExpired(), purgeOld()]).catch((e) => console.error('sweep failed:', e.message))
sweep()
setInterval(sweep, 60 * 60 * 1000).unref()

// Close cleanly on Ctrl+C / deploys
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`)
  server.close(async () => {
    await closePool()
    process.exit(0)
  })
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err))
