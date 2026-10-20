import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import * as refreshTokens from '../repositories/refreshTokens.js'

const ISSUER = 'kaamgar-api'
const AUDIENCE = 'kaamgar-app'
export const REFRESH_COOKIE = 'kg_rt'

// ── Access token: short-lived JWT, sent as "Authorization: Bearer <token>" ──
// `row` is a raw users row (id, role, token_version)
export function signAccessToken(row) {
  return jwt.sign({ role: row.role, tv: row.token_version }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    subject: row.id,
    expiresIn: env.ACCESS_TOKEN_TTL,
    issuer: ISSUER,
    audience: AUDIENCE,
  })
}

export function verifyAccessToken(token) {
  // Pin the algorithm so a forged "alg: none" token can never pass
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'], issuer: ISSUER, audience: AUDIENCE })
}

// ── Refresh token: long-lived random string kept in an httpOnly cookie ──
export const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex')

export function refreshCookieOptions() {
  return {
    httpOnly: true, // JavaScript on the page can never read it (blocks XSS theft)
    secure: env.isProd, // HTTPS only in production
    sameSite: 'strict', // not sent on cross-site requests (blocks CSRF)
    path: '/api/v1/auth', // only sent to the auth endpoints
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  }
}

export const clearRefreshCookie = (res) => {
  const { maxAge, ...opts } = refreshCookieOptions()
  res.clearCookie(REFRESH_COOKIE, opts)
}

// Creates a refresh token row + cookie and returns a fresh access token.
export async function issueSession(row, req, res, { familyId } = {}) {
  const raw = crypto.randomBytes(48).toString('base64url')
  await refreshTokens.create({
    userId: row.id,
    tokenHash: hashToken(raw),
    familyId: familyId ?? crypto.randomUUID(),
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    userAgent: (req.get('user-agent') || '').slice(0, 200),
    ip: req.ip,
  })
  res.cookie(REFRESH_COOKIE, raw, refreshCookieOptions())
  return signAccessToken(row)
}
