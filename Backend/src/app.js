import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import hpp from 'hpp'
import morgan from 'morgan'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { globalLimiter } from './middleware/rateLimiters.js'
import routes from './routes/index.js'
import { ApiError } from './utils/ApiError.js'

const app = express()

app.set('trust proxy', env.TRUST_PROXY) // needed for correct client IPs behind a proxy
app.use(helmet()) // secure HTTP headers
app.use(
  cors({
    // Only the origins listed in CORS_ORIGINS may call the API from a browser.
    // Requests with no Origin (Postman, curl, server-to-server) are allowed.
    origin: (origin, cb) => (!origin || env.corsOrigins.includes(origin) ? cb(null, true) : cb(ApiError.forbidden('Origin not allowed'))),
    credentials: true,
  }),
)
if (env.NODE_ENV !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'))

app.use(express.json({ limit: '10kb' })) // small bodies only
app.use(cookieParser())
app.use(hpp()) // blocks duplicated query parameters

app.use('/api', globalLimiter)
app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }))
app.use('/api/v1', routes)

app.use(notFound)
app.use(errorHandler)

export default app
