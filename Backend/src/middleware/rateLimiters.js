import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

const make = (max, extra = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(ApiError.tooMany('Too many requests. Please try again later.')),
    ...extra,
  })

export const globalLimiter = make(env.RATE_LIMIT_GLOBAL_MAX)
export const authLimiter = make(env.RATE_LIMIT_AUTH_MAX)
// Only failed logins count against this one
export const loginLimiter = make(env.RATE_LIMIT_AUTH_MAX, { skipSuccessfulRequests: true })
// Per logged-in user (use after `authenticate`): stops a customer flooding the queue
export const createLimiter = make(60, { keyGenerator: (req) => req.user?.id ?? 'anonymous' })
