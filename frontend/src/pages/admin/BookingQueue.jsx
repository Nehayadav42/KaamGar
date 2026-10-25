import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AdminHeading from './AdminHeading'
import Button from '../../components/ui/Button'
import ErrorNote from '../../components/ui/ErrorNote'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'
import { fmtVisit, statusLabel } from '../../lib/format'

const ease = [0.22, 1, 0.36, 1]

const filters = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'ASSIGNED', label: 'Assigned' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'COMPLETED', label: 'Completed' },
]

// Lists the workers who can take this booking (active, available, right skill) and allocates one
function AllocatePanel({ booking, onDone, onAllocated }) {
  const { data, error, loading } = useAsync(() => api.admin.eligibleWorkers(booking.id), [booking.id])
  const [picked, setPicked] = useState(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState(null)
  const options = data?.workers ?? []
  const chosen = picked ?? options[0]?.id ?? null

  const confirm = async () => {
    setBusy(true)
    setProblem(null)
    try {
      await api.admin.allocate(booking.id, chosen)
      await onAllocated()
    } catch (err) {
      setProblem(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease }} className="overflow-hidden">
      <div className="glass-soft mb-6 rounded-2xl p-6">
        <p className="eyebrow text-[10.5px]">Allocate a worker</p>
        {loading && <div className="mt-4"><Spinner label="Finding available workers" /></div>}
        {error && <p role="alert" className="mt-3 text-[13px] text-rust">{error.message}</p>}
        {!loading && !error && options.length === 0 && (
          <p className="mt-3 text-[13px] text-muted">
            No active, available worker has the skill for {booking.service}. Check the Workers tab (approve a worker or add the skill).
          </p>
        )}
        {options.length > 0 && (
          <>
            <div role="radiogroup" aria-label="Choose a worker" className="mt-4 space-y-2">
              {options.map((w) => (
                <button key={w.id} type="button" role="radio" aria-checked={chosen === w.id} onClick={() => setPicked(w.id)} className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left text-[13px] transition-colors ${chosen === w.id ? 'border-ink bg-white/60' : 'border-ink/15 hover:border-ink/40'}`}>
                  <span>
                    <span className="font-medium">{w.name}</span>
                    <span className="ml-3 text-muted">{w.areas.join(', ') || 'No areas set'}</span>
                  </span>
                  <span className="text-[12px] text-muted">{w.availability}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[12px] text-muted">You decide who is allocated. Nothing is ranked or scored.</p>
            {problem && <p role="alert" className="mt-3 text-[12.5px] text-rust">{problem.message}</p>}
            <div className="mt-5 flex items-center gap-5">
              <Button arrow={false} disabled={busy || !chosen} onClick={confirm}>{busy ? 'Allocating…' : 'Confirm allocation'}</Button>
              <button type="button" onClick={onDone} className="border-b border-ink pb-0.5 text-[13px] font-medium">Cancel</button>
            </div>
          </>
        )}
        {options.length === 0 && !loading && (
          <button type="button" onClick={onDone} className="mt-4 border-b border-ink pb-0.5 text-[13px] font-medium">Close</button>
        )}
      </div>
    </motion.div>
  )
}

export default function BookingQueue() {
  const [filter, setFilter] = useState('ALL')
  const [allocating, setAllocating] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [movingId, setMovingId] = useState(null)

  const { data, error, loading, reload } = useAsync(
    () => api.admin.bookings({ status: filter === 'ALL' ? undefined : filter, limit: 50 }),
    [filter],
  )
  const shown = data?.bookings ?? []
  const current = filters.find((f) => f.id === filter)

  const advance = async (b) => {
    setMovingId(b.id)
    setActionError(null)
    try {
      await api.admin.advance(b.id)
      await reload({ silent: true })
    } catch (err) {
      setActionError(err)
    } finally {
      setMovingId(null)
    }
  }

  const actionFor = (b) => {
    if (b.status === 'PENDING') return { label: 'Allocate', run: () => setAllocating((id) => (id === b.id ? null : b.id)) }
    if (b.status === 'ASSIGNED') return { label: 'Mark work started', run: () => advance(b) }
    if (b.status === 'IN_PROGRESS') return { label: 'Mark completed', run: () => advance(b) }
    return null
  }

  return (
    <>
      <AdminHeading title="The booking queue." />

      <div role="tablist" aria-label="Filter bookings" className="mt-10 flex flex-wrap gap-x-7 gap-y-2">
        {filters.map((f) => {
          const on = f.id === filter
          return (
            <button key={f.id} type="button" role="tab" aria-selected={on} onClick={() => { setFilter(f.id); setAllocating(null); setActionError(null) }} className={`relative pb-2 text-[12.5px] transition-colors ${on ? 'font-medium text-ink' : 'text-muted hover:text-ink'}`}>
              {f.label}
              {on && <motion.span layoutId="queue-filter" className="absolute inset-x-0 bottom-0 h-px bg-ink" />}
            </button>
          )
        })}
      </div>

      {actionError && <p role="alert" className="mt-6 rounded-xl bg-rust/10 px-4 py-3 text-[13px] text-rust">{actionError.message}</p>}

      <div className="mt-12">
        {loading && <Spinner label="Loading bookings" />}
        {error && <ErrorNote error={error} onRetry={reload} />}

        {!loading && !error && shown.length === 0 && (
          <div>
            <h2 className="font-serif text-[28px] leading-tight">{filter === 'ALL' ? 'No bookings.' : `No ${current.label.toLowerCase()} bookings.`}</h2>
            <p className="mt-2 text-[13px] text-muted">No bookings in this view. New requests from customers will appear here.</p>
            {filter !== 'ALL' && (
              <button type="button" onClick={() => setFilter('ALL')} className="mt-4 border-b border-ink pb-0.5 text-[13px] font-medium hover:border-rust hover:text-rust">Show all bookings</button>
            )}
          </div>
        )}

        {shown.length > 0 && (
          <ul className="border-t border-line">
            {shown.map((b, i) => {
              const action = actionFor(b)
              return (
                <motion.li key={b.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: i * 0.05 }} className="border-b border-line">
                  <div className="grid gap-4 py-6 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-start sm:gap-6">
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.1em] text-muted">{b.ref}</p>
                      <h2 className="mt-1 font-serif text-[26px] leading-tight">{b.service}</h2>
                      <p className="mt-2 text-[12.5px] text-muted">{b.address}</p>
                      <p className="mt-1 text-[12px] text-muted">{b.customerName} · {b.contact}</p>
                    </div>
                    <div className="text-[12.5px]">
                      <p className="text-muted">Preferred visit</p>
                      <p className="mt-1">{fmtVisit(b.date, b.time)}</p>
                    </div>
                    <div className="text-[12.5px]">
                      <p className="flex items-center gap-2 tracking-[0.04em]"><span aria-hidden="true" className="size-1 rounded-full bg-ink" />{statusLabel(b.status)}</p>
                      <p className="mt-1 text-muted">{b.worker ? b.worker.name : 'No worker yet'}</p>
                    </div>
                    <div className="sm:text-right">
                      {action ? (
                        <button type="button" disabled={movingId === b.id} onClick={action.run} className="border-b border-ink pb-0.5 text-[12.5px] font-medium hover:border-rust hover:text-rust disabled:opacity-50">
                          {movingId === b.id ? 'Working…' : `${action.label} →`}
                        </button>
                      ) : (
                        <span className="text-[12px] text-muted">Closed by cooperative</span>
                      )}
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {allocating === b.id && b.status === 'PENDING' && (
                      <AllocatePanel booking={b} onDone={() => setAllocating(null)} onAllocated={async () => { setAllocating(null); await reload({ silent: true }) }} />
                    )}
                  </AnimatePresence>
                </motion.li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
