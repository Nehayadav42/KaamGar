import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AdminHeading from './AdminHeading'
import Button from '../../components/ui/Button'
import ErrorNote from '../../components/ui/ErrorNote'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'
import { AREAS } from '../../lib/constants'

const ease = [0.22, 1, 0.36, 1]
const cols = 'sm:grid-cols-[0.8fr_1.6fr_1.8fr_1.3fr_1fr_1.2fr]'
const AVAILABILITY = ['Available', 'Available except Saturday', 'Unavailable']
const STATUS_LABEL = { active: 'Active', pending: 'Pending approval', suspended: 'Suspended' }

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[#1F211E]" />
      {label}
    </label>
  )
}

// Opens under a worker: approve / suspend, and set skills, areas and availability
function WorkerPanel({ worker, services, onChanged }) {
  const [form, setForm] = useState({
    serviceIds: worker.serviceIds,
    areas: worker.areas,
    availability: worker.availability,
    note: worker.note ?? '',
    verified: worker.verified,
  })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [problem, setProblem] = useState(null)

  const run = async (fn, okMessage) => {
    setBusy(true)
    setProblem(null)
    setMessage(null)
    try {
      await fn()
      setMessage(okMessage)
      await onChanged()
    } catch (err) {
      setProblem(err)
    } finally {
      setBusy(false)
    }
  }
  const flip = (list, value, on) => (on ? [...list, value] : list.filter((x) => x !== value))

  const statusAction = { pending: ['active', 'Approve worker'], active: ['suspended', 'Suspend'], suspended: ['active', 'Re-activate'] }[worker.status]

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
      <div className="glass-soft mb-5 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12.5px] text-muted">{worker.email}{worker.phone ? ` · ${worker.phone}` : ''}</p>
          <Button arrow={false} disabled={busy} onClick={() => run(() => api.admin.setUserStatus(worker.id, statusAction[0]), `Status changed to ${STATUS_LABEL[statusAction[0]]}.`)}>
            {statusAction[1]}
          </Button>
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <p className="eyebrow text-[10px]">Skills</p>
            <div className="mt-3 space-y-2.5">
              {services.map((s) => (
                <Toggle key={s.id} label={s.name} checked={form.serviceIds.includes(s.id)} onChange={(on) => setForm({ ...form, serviceIds: flip(form.serviceIds, s.id, on) })} />
              ))}
              {services.length === 0 && <p className="text-[12px] text-muted">No services yet.</p>}
            </div>
          </div>
          <div>
            <p className="eyebrow text-[10px]">Service areas</p>
            <div className="mt-3 space-y-2.5">
              {AREAS.map((a) => (
                <Toggle key={a} label={a} checked={form.areas.includes(a)} onChange={(on) => setForm({ ...form, areas: flip(form.areas, a, on) })} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
            Availability
            <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className="mt-1 w-full border-b border-ink/25 bg-transparent py-2.5 text-[14px] font-normal normal-case tracking-normal outline-none focus:border-rust">
              {AVAILABILITY.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
            Note (optional)
            <input value={form.note} maxLength={120} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. On leave this week" className="mt-1 w-full border-b border-ink/25 bg-transparent py-2.5 text-[14px] font-normal normal-case tracking-normal outline-none placeholder:text-faint focus:border-rust" />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Toggle label="Cooperative-reviewed (skills and availability checked)" checked={form.verified} onChange={(on) => setForm({ ...form, verified: on })} />
          <Button arrow={false} disabled={busy} onClick={() => run(() => api.admin.updateWorkerProfile(worker.id, { ...form, note: form.note.trim() || null }), 'Profile saved.')}>
            Save profile
          </Button>
        </div>

        {problem && <p role="alert" className="mt-4 text-[12.5px] text-rust">{problem.message}</p>}
        {message && <p role="status" className="mt-4 text-[12.5px] text-muted">{message}</p>}
      </div>
    </motion.div>
  )
}

export default function Workers() {
  const [open, setOpen] = useState(null)
  const { data, error, loading, reload } = useAsync(() => api.admin.workers(), [])
  const svc = useAsync(() => api.admin.services.list(), [])
  const workers = data?.workers ?? []

  return (
    <>
      <AdminHeading title="People behind the work.">
        <p className="mt-10 max-w-[560px] text-[15px] leading-[1.7] text-muted">
          Skills, service areas and availability—visible to everyone coordinating the work. Member records here are real accounts; no rankings or scores.
        </p>
      </AdminHeading>

      <div className="mt-12">
        {loading && <Spinner label="Loading workers" />}
        {error && <ErrorNote error={error} onRetry={reload} />}
        {!loading && !error && workers.length === 0 && (
          <p className="border-y border-line py-10 text-[14px] text-muted">No workers yet. People who sign up as workers appear here, waiting for your approval.</p>
        )}
      </div>

      {workers.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className={`hidden gap-4 border-t border-line py-4 sm:grid ${cols} eyebrow text-[10px]`}>
              <span>Name</span><span>Skills</span><span>Service areas</span><span>Availability</span><span>Status</span><span>Details</span>
            </div>
            {workers.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.05 + i * 0.05 }} className="border-t border-line">
                <div className={`grid gap-4 py-5 text-[13px] ${cols}`}>
                  <button type="button" aria-expanded={open === w.id} onClick={() => setOpen(open === w.id ? null : w.id)} className="w-fit border-b border-ink/50 text-left font-medium hover:border-rust hover:text-rust">{w.name}</button>
                  <span>{w.skills.join(', ') || <span className="text-muted">None yet</span>}</span>
                  <span>{w.areas.join(', ') || <span className="text-muted">None yet</span>}</span>
                  <span>{w.availability}{w.note && <span className="mt-1 block text-[11.5px] text-muted">{w.note}</span>}</span>
                  <span className="flex items-start gap-2"><span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-ink" />{STATUS_LABEL[w.status]}</span>
                  <span>{w.details}</span>
                </div>
                <AnimatePresence initial={false}>
                  {open === w.id && <WorkerPanel key={`${w.id}-${w.status}-${w.availability}`} worker={w} services={svc.data?.services ?? []} onChanged={() => reload({ silent: true })} />}
                </AnimatePresence>
              </motion.div>
            ))}
            <div className="border-t border-line" />
          </div>
        </div>
      )}
    </>
  )
}
