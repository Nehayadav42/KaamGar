import { ApiError } from '../utils/ApiError.js'

// validate({ body: schema, params: schema, query: schema })
// Unknown fields are rejected (the schemas are .strict()), which blocks mass-assignment attacks
// such as sending {"role": "platform_admin"} during sign up.
export const validate = (schemas) => (req, _res, next) => {
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue
    const result = schemas[part].safeParse(req[part] ?? {})
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      return next(ApiError.badRequest('Validation failed', details))
    }
    req[part] = result.data
  }
  next()
}
