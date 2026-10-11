import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import PageHeading from './PageHeading'
import Button from '../../components/ui/Button'
import { useBookings } from '../../context/BookingsContext'

const ease = [0.22, 1, 0.36, 1]

export function StatusList({ booking, className = '' }) {
  const rows = [
    ['Job Status', booking.jobStatus, true],
    ['Verification', booking.verification, false],
    ['Your confirmation', booking.confirmation, true],
  ]
  return (
    <dl className={`text-[12.5px] ${className}`}>
      {rows.map(([label, value, upper]) => (
        <div key={label} className="flex items-center justify-between gap-6 py-1.5">
          <dt className="text-muted">{label}</dt>
          <dd className={`flex items-center gap-2 ${upper ? 'tracking-[0.04em]' : ''}`}>
            <span aria-hidden="true" className="size-1 rounded-full bg-ink" />
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export default function MyBookings() {
  const { bookings } = useBookings()
  const navigate = useNavigate()

  return (
    <>
      <PageHeading title="Your work, in one place." />

      <ul className="mt-14 border-t border-line">
        {bookings.map((b, i) => (
          <motion.li
            key={b.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.1 + i * 0.07 }}
            className="border-b border-line"
          >
            <Link
              to={`/customer/bookings/${b.id}`}
              className="group grid gap-6 px-1 py-8 transition-colors hover:bg-white/35 sm:grid-cols-[1fr_300px] sm:px-3"
            >
              <div>
                <h2 className="flex items-center gap-2 font-serif text-[28px] leading-tight tracking-[-0.01em]">
                  {b.service}
                  <ArrowUpRight
                    size={18}
                    className="text-ink/60 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </h2>
                <p className="mt-3 text-[12px] text-muted">
                  {b.date} · {b.time}
                </p>
                <p className="mt-1 text-[12px] text-muted">
                  {b.example ? `Illustrative example · ${b.address}` : b.address}
                </p>
              </div>
              <StatusList booking={b} />
            </Link>
          </motion.li>
        ))}
      </ul>

      {/* Floating call to action, like the design */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 mx-auto flex max-w-[1240px] justify-end px-5 sm:px-[60px]">
        <div className="pointer-events-auto">
          <Button arrow={false} size="lg" onClick={() => navigate('/customer')}>
            Choose a service
          </Button>
        </div>
      </div>
    </>
  )
}
