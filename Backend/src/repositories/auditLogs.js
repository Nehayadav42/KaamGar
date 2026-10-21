import { pool } from '../db/pool.js'

export const insert = ({ actorId, actorRole, action, targetType, targetId, ip, userAgent, meta }) =>
  pool.query(
    `INSERT INTO audit_logs (actor_id, actor_role, action, target_type, target_id, ip, user_agent, meta)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [actorId ?? null, actorRole ?? null, action, targetType ?? null, targetId ?? null, ip ?? null, userAgent ?? null, meta ?? null],
  )

export async function list({ action, limit, offset }) {
  const params = action ? [action] : []
  const clause = action ? 'WHERE action = $1' : ''
  const [data, count] = await Promise.all([
    pool.query(
      `SELECT id::text, actor_id, actor_role, action, target_type, target_id, ip, user_agent, meta, created_at
       FROM audit_logs ${clause} ORDER BY created_at DESC, id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
    pool.query(`SELECT count(*)::int AS total FROM audit_logs ${clause}`, params),
  ])
  const logs = data.rows.map((r) => ({
    id: r.id,
    actorId: r.actor_id,
    actorRole: r.actor_role,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    ip: r.ip,
    userAgent: r.user_agent,
    meta: r.meta,
    createdAt: r.created_at,
  }))
  return { logs, total: count.rows[0].total }
}
