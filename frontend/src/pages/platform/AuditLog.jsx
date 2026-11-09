import { useState } from 'react'
import PlatformHeading from './PlatformHeading'
import ErrorNote from '../../components/ui/ErrorNote'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'
import { fmtDateTime } from '../../lib/format'

const FILTERS = ['', 'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'LOGIN_WRONG_DOOR', 'COOP_ADMIN_INVITED', 'INVITE_ACCEPTED', 'WORKER_APPROVED', 'WORKER_DECLINED', 'BOOKING_ALLOCATED', 'USER_STATUS_CHANGED', 'REFRESH_REUSE_DETECTED']
const LIMIT = 25

export default function AuditLog() {
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useAsync(() => api.admin.auditLogs({ action: action || undefined, page, limit: LIMIT }), [action, page])
  const pages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1

  return (
    <>
      <PlatformHeading title="Audit log."><p className="mt-6 max-w-[560px] text-[15px] leading-[1.7] text-muted">Every important action, with who did it and when. Passwords, links and card numbers are never recorded.</p></PlatformHeading>
      <div className="mt-10">
        <label className="text-[11px] font-semibold uppercase tracking-[0.12em]">Show
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} className="ml-3 border-b border-ink/25 bg-transparent py-1.5 text-[13px] font-normal normal-case tracking-normal outline-none">
            {FILTERS.map((f) => <option key={f} value={f}>{f ? f.replaceAll('_', ' ').toLowerCase() : 'everything'}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-8">{loading && <Spinner label="Loading" />}{error && <ErrorNote error={error} onRetry={reload} />}</div>
      {data && (
        <>
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] border-t border-line text-left text-[12.5px]">
            <thead><tr className="eyebrow text-[10px]"><th className="py-3 font-medium">When</th><th className="font-medium">What</th><th className="font-medium">Who</th><th className="font-medium">From</th></tr></thead>
            <tbody>
              {data.logs.map((l) => (
                <tr key={l.id} className="border-t border-line align-top">
                  <td className="py-3 pr-4 text-muted">{fmtDateTime(l.createdAt)}</td>
                  <td className="pr-4">{l.action.replaceAll('_', ' ').toLowerCase()}</td>
                  <td className="pr-4">{l.actorRole ? l.actorRole.replace('_', ' ') : 'not signed in'}</td>
                  <td className="text-muted">{l.ip ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          {data.logs.length === 0 && <p className="border-y border-line py-10 text-[14px] text-muted">Nothing here yet.</p>}
          <div className="mt-6 flex items-center justify-between text-[12.5px]">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="border-b border-ink pb-0.5 font-medium disabled:opacity-30">← Newer</button>
            <span className="text-muted">Page {page} of {pages} · {data.total} events</span>
            <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="border-b border-ink pb-0.5 font-medium disabled:opacity-30">Older →</button>
          </div>
        </>
      )}
    </>
  )
}
