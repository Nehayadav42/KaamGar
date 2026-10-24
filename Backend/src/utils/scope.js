import { ROLES } from '../constants/roles.js'
import * as cooperatives from '../repositories/cooperatives.js'
import { ApiError } from './ApiError.js'

// Which bookings an admin may see: a cooperative admin only their own cooperative, a platform admin all.
export const adminBookingScope = (user) => (user.role === ROLES.COOP_ADMIN ? { cooperativeId: user.cooperativeId } : {})

// Which cooperative an admin is working in. The pilot has one, so a platform admin gets the default.
export async function workingCooperativeId(user) {
  if (user.role === ROLES.COOP_ADMIN) return user.cooperativeId
  const coop = await cooperatives.findDefault()
  if (!coop) throw ApiError.badRequest('No cooperative exists yet')
  return coop.id
}

// A cooperative admin may only touch records of their own cooperative; anything else is "not found".
export const canManage = (user, cooperativeId) => user.role === ROLES.PLATFORM_ADMIN || user.cooperativeId === cooperativeId
