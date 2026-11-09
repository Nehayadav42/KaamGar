import { motion } from 'framer-motion'
import PlatformHeading from './PlatformHeading'
import ErrorNote from '../../components/ui/ErrorNote'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'
import { fmtDateTime } from '../../lib/format'

const ease = [0.22, 1, 0.36, 1]

export default function PlatformOverview() {
  const { data, error, loading, reload } = useAsync(() => api.admin.platformOverview(), [])
  const c = data?.counts
  const cards = c && [
    ['Cooperatives', c.cooperatives, 'active'],
    ['Cooperative admins', c.coopAdmins.active, `${c.coopAdmins.invited} invited, not joined yet`],
    ['Workers', c.workers.active, `${c.workers.pending} waiting for approval`],
    ['Customers', c.customers, 'registered'],
    ['Bookings', c.bookings.total, `${c.bookings.pending} pending · ${c.bookings.completed} completed`],
  ]
  return (
    <>
      <PlatformHeading title="The whole platform."><p className="mt-6 max-w-[560px] text-[15px] leading-[1.7] text-muted">You add and look after cooperative admins. They run their cooperative’s workers and bookings.</p></PlatformHeading>
      <div className="mt-12">{loading && <Spinner label="Loading" />}{error && <ErrorNote error={error} onRetry={reload} />}</div>
      {cards && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(([label, value, sub], i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: i * 0.06 }} className="glass rounded-3xl p-6">
              <p className="eyebrow text-[10px]">{label}</p>
              <p className="mt-6 font-serif text-[48px] leading-none">{value}</p>
              <p className="mt-2 text-[12px] text-muted">{sub}</p>
            </motion.div>
          ))}
        </div>
      )}
      {data && (
        <section className="mt-16">
          <p className="eyebrow text-[10.5px]">Recent activity</p>
          <ul className="mt-4 border-t border-line">
            {data.recent.map((l) => (
              <li key={l.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-3 text-[12.5px]">
                <span>{l.action.replaceAll('_', ' ').toLowerCase()}{l.actorRole ? ` · ${l.actorRole.replace('_', ' ')}` : ''}</span>
                <span className="text-[11.5px] text-muted">{fmtDateTime(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
