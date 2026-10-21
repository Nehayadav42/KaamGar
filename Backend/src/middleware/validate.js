
import { ApiError } from '../utils/ApiError.js'

// Validate request params, query, and body.
// Reject unknown fields when schemas are strict.
export const validate = (schemas) => (req, _res, next) => {
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue

    const result = schemas[part].safeParse(req[part] ?? {})

    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }))

      return next(ApiError.badRequest('Validation failed', details))
    }

    if (part === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true,
      })
    } else {
      req[part] = result.data
    }
  }

  next()
}
