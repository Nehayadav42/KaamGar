import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import AdminHeading from './AdminHeading'
import { useBookings } from '../../context/BookingsContext'
import { todayISO } from '../../utils/format'

const ease = [0.22, 1, 0.36, 1]

export default function Overview() {
  const { bookings } = useBookings()

  const toAllocate = bookings.filter((b) => b.jobStatus === 'PENDING')
  const toReview = bookings.filter((b) => b.jobStatus === 'COMPLETED' && b.verification !== 'Reviewed')
  const attention = [
    ...toAllocate.map((b) => ({ b, why: 'Needs a worker', to: '/admin/bookings' })),
    ...toReview.map((b) => ({ b, why: 'Waiting for review', to: '/admin/review' })),
  ]

  const numbers = [
    ['Completed jobs today', bookings.filter((b) => b.completedOn === todayISO()).length],
    ['Bookings in progress', bookings.filter((b) => b.jobStatus === 'ASSIGNED' || b.jobStatus === 'IN_PROGRESS').length],
    ['Awaiting customer confirmation', bookings.filter((b) => b.jobStatus === 'COMPLETED' && b.confirmation === 'PENDING').length],
  ]

  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

  return (
    <>
      <AdminHeading
        eyebrow="A clear start to your day"
        title="Needs your attention"
        lead={
          <p className="mt-8 text-[15px] text-muted">
            {plural(toAllocate.length, 'booking')} to allocate, {toReview.length} waiting for review
          </p>
        }
      />

      <section className="mt-12 border-t border-line pt-10">
        {attention.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            <h2 className="font-serif text-[28px] leading-tight">Everything is clear for now.</h2>
            <p className="mt-2 text-[13px] text-muted">No new bookings. New requests from customers will appear here.</p>
            <Link to="/admin/bookings" className="mt-4 inline-block border-b border-ink pb-0.5 text-[13px] font-medium hover:border-rust hover:text-rust">
              See all bookings →
            </Link>
          </motion.div>
        ) : (
          <ul>
            {attention.map(({ b, why, to }, i) => (
              <motion.li
                key={`${b.id}-${why}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease, delay: i * 0.06 }}
                className="border-b border-line first:border-t-0"
              >
                <Link
                  to={to}
                  className="group grid items-baseline gap-2 py-5 transition-colors hover:bg-white/35 sm:grid-cols-[1.4fr_1fr_auto] sm:px-2"
                >
                  <span>
                    <span className="block font-serif text-[24px] leading-tight">{b.service}</span>
                    <span className="mt-1 block text-[12px] text-muted">
                      {b.id} · {b.address}
                    </span>
                  </span>
                  <span className="text-[12.5px]">· {why}</span>
                  <span className="border-b border-ink pb-0.5 text-[12.5px] font-medium transition-colors group-hover:border-rust group-hover:text-rust">
                    Open →
                  </span>
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
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.2 + i * 0.07 }}
              className="grid grid-cols-[minmax(0,1fr)_1fr] items-baseline gap-4 py-3.5 text-[13.5px] sm:grid-cols-[minmax(0,420px)_1fr]"
            >
              <dt>{label}</dt>
              <dd className="font-serif text-[22px] leading-none">{value}</dd>
            </motion.div>
          ))}
        </dl>
        <p className="mt-6 text-[11.5px] text-muted">
          Counts reflect this browser’s records, including any labelled examples.
        </p>
      </section>
    </>
  )
}