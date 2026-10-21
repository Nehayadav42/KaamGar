import { USER_STATUS } from '../constants/roles.js'
import { ApiError } from '../utils/ApiError.js'

// Step 2: "are you allowed?"  Use after `authenticate`.
//   router.get('/x', authenticate, authorize(ROLES.PLATFORM_ADMIN), handler)
export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized())
  if (!allowedRoles.includes(req.user.role)) return next(ApiError.forbidden())
  next()
}

// For actions that need an approved account (e.g. a worker still "pending" must wait)
export const requireActive = (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized())
  if (req.user.status !== USER_STATUS.ACTIVE) {
    return next(ApiError.forbidden('Your account is awaiting approval'))
  }
  next()
}
