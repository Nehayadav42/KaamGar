const STATUS_LABEL = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN PROGRESS',
  EVIDENCE_SUBMITTED: 'EVIDENCE SUBMITTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}
export const statusLabel = (s) => STATUS_LABEL[s] ?? s

const VERIFICATION_LABEL = {
  AWAITING_EVIDENCE: 'Awaiting work evidence',
  AWAITING_REVIEW: 'Awaiting review',
  REVIEWED: 'Reviewed',
}
export const verificationLabel = (v) => VERIFICATION_LABEL[v] ?? v

// "10 Oct 2026, 10:29 am"
export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

export const fmtVisit = (date, time) => (date && time ? `${date} · ${time}` : 'No preferred time')

// "Today" in India as YYYY-MM-DD, matching the server
export const todayIST = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())

// "just now", "5 min ago", "3 h ago", "2 d ago", then the date
export function fmtRelative(iso) {
  const sec = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (sec < 45) return 'just now'
  if (sec < 3600) return `${Math.round(sec / 60)} min ago`
  if (sec < 86400) return `${Math.round(sec / 3600)} h ago`
  if (sec < 7 * 86400) return `${Math.round(sec / 86400)} d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
