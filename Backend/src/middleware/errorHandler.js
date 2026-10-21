import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

export const notFound = (req, _res, next) => next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`))

// One place that turns every error into a consistent, safe JSON response.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let status = 500
  let code = 'INTERNAL_ERROR'
  let message = 'Something went wrong'
  let details

  if (err instanceof ApiError) {
    ;({ status, code, message, details } = err)
  } else if (err.type === 'entity.parse.failed') {
    status = 400; code = 'INVALID_JSON'; message = 'Request body is not valid JSON'
  } else if (err.type === 'entity.too.large') {
    status = 413; code = 'PAYLOAD_TOO_LARGE'; message = 'Request body is too large'
  } else if (err.code === '23505') {
    // PostgreSQL: unique constraint (e.g. duplicate email)
    status = 409; code = 'CONFLICT'; message = 'That value is already in use'
  } else if (err.code === '23503') {
    status = 400; code = 'BAD_REQUEST'; message = 'A referenced record does not exist'
  } else if (err.code === '23514' || err.code === '22001' || err.code === '22P02') {
    // check constraint, value too long, invalid text representation
    status = 400; code = 'BAD_REQUEST'; message = 'Invalid value'
  } else if (err.code === '57014') {
    status = 503; code = 'TIMEOUT'; message = 'The request took too long'
  }

  if (status >= 500) console.error(`[${req.method} ${req.originalUrl}]`, err)

  res.status(status).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}), ...(!env.isProd && status >= 500 ? { stack: err.stack } : {}) },
  })
}
