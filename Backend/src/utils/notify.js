import * as notifications from '../repositories/notifications.js'
import * as users from '../repositories/users.js'

// Sends in-app notifications. Call it AFTER the main work has been saved.
// A notification problem is logged but never breaks the action that caused it.
export async function notify(userIds, payload) {
  const ids = [...new Set([userIds].flat().filter(Boolean))]
  if (!ids.length) return
  try {
    await notifications.insertMany(ids, payload)
  } catch (err) {
    console.error('notify failed:', err.message)
  }
}

export const notifyCoopAdmins = async (cooperativeId, payload) => notify(await users.adminIdsForCooperative(cooperativeId), payload)
export const notifyPlatformAdmins = async (payload) => notify(await users.platformAdminIds(), payload)
