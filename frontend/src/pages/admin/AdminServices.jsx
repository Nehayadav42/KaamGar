import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import AdminHeading from './AdminHeading'
import Button from '../../components/ui/Button'
import ErrorNote from '../../components/ui/ErrorNote'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'

const ease = [0.22, 1, 0.36, 1]
const cols = 'sm:grid-cols-[1.6fr_1.2fr_1.8fr_0.8fr_3rem]'

export default function AdminServices() {
  const navigate = useNavigate()
  const { data, error, loading, reload } = useAsync(() => api.admin.services.list(), [])
  const services = data?.services ?? []

  return (
    <>
      <AdminHeading title="Services, clearly defined." />

      <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[560px] text-[16px] leading-[1.7] text-muted">Define what your cooperative offers, where it’s available, and the records each job needs.</p>
        <Button size="lg" onClick={() => navigate('/admin/services/new')}>Add service</Button>
      </div>

      <div className="mt-10">
        {loading && <Spinner label="Loading services" />}
        {error && <ErrorNote error={error} onRetry={reload} />}
      </div>

      {services.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            <div className={`hidden gap-4 border-t border-line py-4 sm:grid ${cols} eyebrow text-[10px]`}>
              <span>Service name</span><span>Category</span><span>Areas covered</span><span>Status</span><span />
            </div>
            {services.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.05 + i * 0.06 }} className="border-t border-line">
                <div className={`grid items-center gap-4 py-6 text-[13px] ${cols}`}>
                  <span className="font-serif text-[24px] leading-tight">{s.name}</span>
                  <span>{s.category}</span>
                  <span>{s.areas.length ? s.areas.join(', ') : '—'}</span>
                  <span className="flex items-center gap-2"><span aria-hidden="true" className={`size-1 rounded-full ${s.active ? 'bg-ink' : 'bg-faint'}`} />{s.active ? 'Active' : 'Inactive'}</span>
                  <Link to={`/admin/services/${s.id}`} className="w-fit border-b border-ink pb-0.5 text-[12.5px] font-medium hover:border-rust hover:text-rust">Edit</Link>
                </div>
              </motion.div>
            ))}
            <div className="border-t border-line" />
          </div>
        </div>
      )}

      <p className="mt-8 max-w-[560px] text-[12px] leading-relaxed text-muted">
        Inactive services stay in your records but are hidden from the Customer catalogue. Existing bookings keep the requirements selected when they were created.
      </p>
    </>
  )
}
