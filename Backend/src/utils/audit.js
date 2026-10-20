import * as auditLogs from '../repositories/auditLogs.js'

// Auditing must never break the request it describes, so failures are only logged.
// `actor` can be req.user (public user) or any object with { id, role }.
export async function audit(req, action, { actor, targetType, targetId, meta } = {}) {
  try {
    const who = actor ?? req.user ?? null
    await auditLogs.insert({
      actorId: who?.id ?? null,
      actorRole: who?.role ?? null,
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      ip: req.ip,
      userAgent: (req.get('user-agent') || '').slice(0, 200),
      meta: meta ? JSON.stringify(meta) : null,
    })
  } catch (err) {
    console.error('audit log failed:', err.message)
  }
}
