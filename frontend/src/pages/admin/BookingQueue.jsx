import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AdminHeading from './AdminHeading'
import Button from '../../components/ui/Button'
import { useBookings } from '../../context/BookingsContext'
import { ORG, workers } from '../../data/admin'

const ease = [0.22, 1, 0.36, 1]

const filters = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'ASSIGNED', label: 'Assigned' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'COMPLETED', label: 'Completed' },
]

// Only active, available workers whose skills match the booked service
const eligibleFor = (booking) =>
  workers.filter(
    (w) => w.status === 'Active' && w.availability !== 'Unavailable' && w.skills.includes(booking.service),
  )

function AllocatePanel({ booking, onDone }) {
  const { allocateBooking } = useBookings()
  const options = eligibleFor(booking)
  const [picked, setPicked] = useState(options[0]?.id ?? null)

  const confirm = () => {
    const w = options.find((o) => o.id === picked)
    if (!w) return
    allocateBooking(booking.id, {
      name: `${w.name} (demo)`,
      skill: w.skills.join(', '),
      cooperative: ORG.name,
    })
    onDone()
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.4, ease }}
      className="overflow-hidden"
    >
      <div className="glass-soft mb-6 rounded-2xl p-6">
        <p className="eyebrow text-[10.5px]">Allocate a worker</p>
        {options.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted">
            No active, available worker has the skill for {booking.service}. Check the Workers tab.
          </p>
        ) : (
          <>
            <div role="radiogroup" aria-label="Choose a worker" className="mt-4 space-y-2">
              {options.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  role="radio"
                  aria-checked={picked === w.id}
                  onClick={() => setPicked(w.id)}
                  className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left text-[13px] transition-colors ${
                    picked === w.id ? 'border-ink bg-white/60' : 'border-ink/15 hover:border-ink/40'
                  }`}
                >
                  <span>
                    <span className="font-medium">{w.name}</span>
                    <span className="ml-3 text-muted">{w.areas.join(', ')}</span>
                  </span>
                  <span className="text-[12px] text-muted">{w.availability}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-[12px] text-muted">
              You decide who is allocated. Nothing is ranked or scored.
            </p>
            <div className="mt-5 flex items-center gap-5">
              <Button arrow={false} onClick={confirm}>Confirm allocation</Button>
              <button type="button" onClick={onDone} className="border-b border-ink pb-0.5 text-[13px] font-medium">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default function BookingQueue() {
  const { bookings, advanceBooking } = useBookings()
  const [filter, setFilter] = useState('ALL')
  const [allocating, setAllocating] = useState(null)

  const shown = filter === 'ALL' ? bookings : bookings.filter((b) => b.jobStatus === filter)
  const current = filters.find((f) => f.id === filter)

  const actionFor = (b) => {
    if (b.jobStatus === 'PENDING') return { label: 'Allocate', run: () => setAllocating((id) => (id === b.id ? null : b.id)) }
    if (b.jobStatus === 'ASSIGNED') return { label: 'Mark work started', run: () => advanceBooking(b.id) }
    if (b.jobStatus === 'IN_PROGRESS') return { label: 'Mark completed', run: () => advanceBooking(b.id) }
    return null
  }

  return (
    <>
      <AdminHeading title="The booking queue." />

      {/* Filter tabs */}
      <div role="tablist" aria-label="Filter bookings" className="mt-10 flex flex-wrap gap-x-7 gap-y-2">
        {filters.map((f) => {
          const on = f.id === filter
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setFilter(f.id)}
              className={`relative pb-2 text-[12.5px] transition-colors ${on ? 'font-medium text-ink' : 'text-muted hover:text-ink'}`}
            >
              {f.label}
              {on && <motion.span layoutId="queue-filter" className="absolute inset-x-0 bottom-0 h-px bg-ink" />}
            </button>
          )
        })}
      </div>

      <div className="mt-12">
        {shown.length === 0 ? (
          <div>
            <h2 className="font-serif text-[28px] leading-tight">
              {filter === 'ALL' ? 'No bookings.' : `No ${current.label.toLowerCase()} bookings.`}
            </h2>
            <p className="mt-2 text-[13px] text-muted">No bookings in this view. New requests from customers will appear here.</p>
            {filter !== 'ALL' && (
              <button type="button" onClick={() => setFilter('ALL')} className="mt-4 border-b border-ink pb-0.5 text-[13px] font-medium hover:border-rust hover:text-rust">
                Show all bookings
              </button>
            )}
          </div>
        ) : (
          <ul className="border-t border-line">
            {shown.map((b, i) => {
              const action = actionFor(b)
              return (
                <motion.li
                  key={b.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease, delay: i * 0.05 }}
                  className="border-b border-line"
                >
                  <div className="grid gap-4 py-6 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-start sm:gap-6">
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.1em] text-muted">{b.id}</p>
                      <h2 className="mt-1 font-serif text-[26px] leading-tight">{b.service}</h2>
                      <p className="mt-2 text-[12.5px] text-muted">{b.address}</p>
                    </div>
                    <div className="text-[12.5px]">
                      <p className="text-muted">Preferred visit</p>
                      <p className="mt-1">{b.date} · {b.time}</p>
                    </div>
                    <div className="text-[12.5px]">
                      <p className="flex items-center gap-2 tracking-[0.04em]">
                        <span aria-hidden="true" className="size-1 rounded-full bg-ink" />
                        {b.jobStatus.replace('_', ' ')}
                      </p>
                      <p className="mt-1 text-muted">{b.worker ? b.worker.name : 'No worker yet'}</p>
                    </div>
                    <div className="sm:text-right">
                      {action ? (
                        <button
                          type="button"
                          onClick={action.run}
                          className="border-b border-ink pb-0.5 text-[12.5px] font-medium hover:border-rust hover:text-rust"
                        >
                          {action.label} →
                        </button>
                      ) : (
                        <span className="text-[12px] text-muted">Closed by cooperative</span>
                      )}
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {allocating === b.id && b.jobStatus === 'PENDING' && (
                      <AllocatePanel booking={b} onDone={() => setAllocating(null)} />
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