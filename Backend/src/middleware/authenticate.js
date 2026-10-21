import jwt from 'jsonwebtoken'
import { USER_STATUS } from '../constants/roles.js'
import * as users from '../repositories/users.js'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { verifyAccessToken } from '../utils/tokens.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Step 1 of every protected route: "who are you?"
// Reads the Bearer token, verifies it, then re-checks the user in the database so that
// suspended users and logged-out sessions are cut off immediately.
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.get('authorization') || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) throw ApiError.unauthorized('Missing or malformed Authorization header')

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'TOKEN_EXPIRED', 'Access token expired. Call /auth/refresh.')
    }
    throw ApiError.unauthorized('Invalid access token')
  }
  if (!UUID.test(payload.sub)) throw ApiError.unauthorized('Invalid access token')

  const row = await users.findById(payload.sub)
  if (!row) throw ApiError.unauthorized('Invalid access token')
  if (row.token_version !== payload.tv) {
    throw new ApiError(401, 'SESSION_REVOKED', 'Session is no longer valid. Please log in again.')
  }
  if (row.status === USER_STATUS.SUSPENDED) throw ApiError.forbidden('This account is suspended')

  req.user = users.toPublicUser(row)
  next()
})
