import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import AdminHeading from './AdminHeading'
import ErrorNote from '../../components/ui/ErrorNote'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'

const ease = [0.22, 1, 0.36, 1]
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

export default function Overview() {
  const { data, error, loading, reload } = useAsync(() => api.admin.overview(), [])

  if (loading) return <><AdminHeading eyebrow="A clear start to your day" title="Needs your attention" /><div className="mt-12"><Spinner label="Loading" /></div></>
  if (error) return <><AdminHeading eyebrow="A clear start to your day" title="Needs your attention" /><div className="mt-12"><ErrorNote error={error} onRetry={reload} /></div></>

  const { counts, attention } = data
  const items = [
    ...attention.toAllocate.map((b) => ({ b, why: 'Needs a worker', to: '/admin/bookings' })),
    ...attention.toReview.map((b) => ({ b, why: 'Waiting for review', to: '/admin/review' })),
  ]
  const numbers = [
    ['Completed jobs today', counts.completedToday],
    ['Bookings in progress', counts.inProgress],
    ['Awaiting customer confirmation', counts.awaitingConfirmation],
  ]

  return (
    <>
      <AdminHeading
        eyebrow="A clear start to your day"
        title="Needs your attention"
        lead={<p className="mt-8 text-[15px] text-muted">{plural(counts.toAllocate, 'booking')} to allocate, {counts.toReview} waiting for review</p>}
      />

      <section className="mt-12 border-t border-line pt-10">
        {items.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <h2 className="font-serif text-[28px] leading-tight">Everything is clear for now.</h2>
            <p className="mt-2 text-[13px] text-muted">No new bookings. New requests from customers will appear here.</p>
            <Link to="/admin/bookings" className="mt-4 inline-block border-b border-ink pb-0.5 text-[13px] font-medium hover:border-rust hover:text-rust">See all bookings →</Link>
          </motion.div>
        ) : (
          <ul>
            {items.map(({ b, why, to }, i) => (
              <motion.li key={`${b.id}-${why}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: i * 0.06 }} className="border-b border-line">
                <Link to={to} className="group grid items-baseline gap-2 py-5 transition-colors hover:bg-white/35 sm:grid-cols-[1.4fr_1fr_auto] sm:px-2">
                  <span>
                    <span className="block font-serif text-[24px] leading-tight">{b.service}</span>
                    <span className="mt-1 block text-[12px] text-muted">{b.ref} · {b.address}</span>
                  </span>
                  <span className="text-[12.5px]">· {why}</span>
                  <span className="border-b border-ink pb-0.5 text-[12.5px] font-medium transition-colors group-hover:border-rust group-hover:text-rust">Open →</span>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-20">
        <p className="eyebrow text-[10.5px]">Today in plain numbers</p>
        <dl className="mt-6 max-w-[760px]">
          {numbers.map(([label, value], i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.2 + i * 0.07 }} className="grid grid-cols-[minmax(0,1fr)_1fr] items-baseline gap-4 py-3.5 text-[13.5px] sm:grid-cols-[minmax(0,420px)_1fr]">
              <dt>{label}</dt>
              <dd className="font-serif text-[22px] leading-none">{value}</dd>
            </motion.div>
          ))}
        </dl>
        <p className="mt-6 text-[11.5px] text-muted">Counts come from the cooperative’s live records.</p>
      </section>
    </>
  )
}
