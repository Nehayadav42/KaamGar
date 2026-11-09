import * as notifications from '../repositories/notifications.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const ok = (res, data) => res.json({ success: true, data })

// GET /notifications: the bell. Everyone sees only their own.
export const list = asyncHandler(async (req, res) => {
  ok(res, await notifications.list(req.user.id, { unreadOnly: Boolean(req.query.unread), limit: req.query.limit }))
})

export const markRead = asyncHandler(async (req, res) => {
  await notifications.markRead(req.params.id, req.user.id) // the query also checks it belongs to this person
  ok(res, { message: 'Marked as read' })
})

export const markAllRead = asyncHandler(async (req, res) => {
  await notifications.markAllRead(req.user.id)
  ok(res, { message: 'All marked as read' })
})
