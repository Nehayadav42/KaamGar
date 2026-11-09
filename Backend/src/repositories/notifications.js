import { pool } from '../db/pool.js'

const toNotification = (r) => ({
  id: r.id,
  type: r.type,
  title: r.title,
  body: r.body,
  link: r.link,
  read: Boolean(r.read_at),
  createdAt: r.created_at,
})

// One notification for each of several people
export const insertMany = (userIds, { type, title, body, link }) =>
  pool.query(
    `INSERT INTO notifications (user_id, type, title, body, link)
     SELECT unnest($1::uuid[]), $2, $3, $4, $5`,
    [userIds, type, title, body ?? null, link ?? null],
  )

export async function list(userId, { unreadOnly, limit }) {
  const [rows, unread] = await Promise.all([
    pool.query(
      `SELECT id::text, type, title, body, link, read_at, created_at FROM notifications
       WHERE user_id = $1 ${unreadOnly ? 'AND read_at IS NULL' : ''}
       ORDER BY created_at DESC, id DESC LIMIT $2`,
      [userId, limit],
    ),
    pool.query('SELECT count(*)::int AS n FROM notifications WHERE user_id = $1 AND read_at IS NULL', [userId]),
  ])
  return { notifications: rows.rows.map(toNotification), unreadCount: unread.rows[0].n }
}

// Scoped to the owner: nobody can mark someone else's notification
export const markRead = (id, userId) =>
  pool.query('UPDATE notifications SET read_at = now() WHERE id = $1 AND user_id = $2 AND read_at IS NULL', [id, userId])

export const markAllRead = (userId) =>
  pool.query('UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL', [userId])

export const purgeOld = () => pool.query("DELETE FROM notifications WHERE created_at < now() - interval '90 days'")
