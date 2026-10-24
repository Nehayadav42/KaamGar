import app from './app.js'
import { env } from './config/env.js'
import { closePool, connectDB } from './db/pool.js'
import { purgeExpired } from './repositories/refreshTokens.js'

await connectDB()
const server = app.listen(env.PORT, () => console.log(`KaamGar API running on http://localhost:${env.PORT} (${env.NODE_ENV})`))

// Sweep expired refresh tokens at start-up and then every hour
const sweep = () => purgeExpired().catch((e) => console.error('token sweep failed:', e.message))
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
