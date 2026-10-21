// An error that is safe to show to the client.
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, 'BAD_REQUEST', message, details)
  }
  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, 'UNAUTHORIZED', message)
  }
  static forbidden(message = 'You do not have permission to do this') {
    return new ApiError(403, 'FORBIDDEN', message)
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, 'NOT_FOUND', message)
  }
  static conflict(message = 'Conflict') {
    return new ApiError(409, 'CONFLICT', message)
  }
  static tooMany(message = 'Too many requests') {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message)
  }
}
