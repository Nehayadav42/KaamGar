import crypto from 'crypto'
import { env } from '../config/env.js'
import * as authTokens from '../repositories/authTokens.js'
import { hashToken } from './tokens.js'

export const INVITE_HOURS = 48
export const ADMIN_RESET_HOURS = 48
export const SELF_RESET_MINUTES = 60

// Makes a single-use link and returns it. Only the hash is stored in the database.
export async function createSetupLink(userId, purpose, ttlMinutes, client) {
  const raw = crypto.randomBytes(32).toString('base64url')
  await authTokens.replace({ userId, purpose, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000) }, client)
  return `${env.APP_URL}/set-password?token=${raw}`
}
