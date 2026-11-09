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
const input = 'mt-1 w-full border-b border-ink/25 bg-transparent py-2.5 text-[14px] font-normal normal-case tracking-normal outline-none placeholder:text-faint focus:border-rust'

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[#1F211E]" />
      {label}
    </label>
  )
}
const flip = (list, value, on) => (on ? [...list, value] : list.filter((x) => x !== value))

// Opens under a worker. For a NEW worker: check the details, correct them if needed, then Approve or Decline.
// For an existing worker: change skills, areas and availability, or suspend / re-activate.
function WorkerPanel({ worker, services, onChanged }) {
  const pending = worker.status === 'pending'
  const [form, setForm] = useState({
    serviceIds: worker.serviceIds,
    areas: worker.areas,
    availability: worker.availability,
    note: worker.note ?? '',
    shramikCardNumber: worker.shramikCardNumber ?? '',
    verified: worker.verified,
  })
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [problem, setProblem] = useState(null)

  const run = async (fn, ok) => {
    setBusy(true); setProblem(null); setMessage(null)
    try { await fn(); setMessage(ok); await onChanged() } catch (err) { setProblem(err) } finally { setBusy(false) }
  }
  const body = () => ({ serviceIds: form.serviceIds, areas: form.areas, availability: form.availability, note: form.note.trim() || null, ...(form.shramikCardNumber ? { shramikCardNumber: form.shramikCardNumber.trim() } : {}) })
  const fieldError = (n) => problem?.details?.find((d) => d.field === n)?.message
  const statusAction = { active: ['suspended', 'Suspend'], suspended: ['active', 'Re-activate'] }[worker.status]

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
      <div className="glass-soft mb-5 rounded-2xl p-6">
        {pending && (
          <div className="mb-6 rounded-xl bg-white/60 p-4 text-[13px]">
            <p className="eyebrow text-[10px]">What the worker submitted</p>
            <dl className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              <div><dt className="text-muted">Mobile</dt><dd className="font-medium">{worker.phone}</dd></div>
              <div><dt className="text-muted">Email</dt><dd className="break-all font-medium">{worker.email}</dd></div>
              <div><dt className="text-muted">Shramik card</dt><dd className="font-medium">{worker.shramikCardNumber ?? 'Not given'}</dd></div>
              <div><dt className="text-muted">Signed up</dt><dd>{new Date(worker.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</dd></div>
            </dl>
            <p className="mt-3 text-[12px] text-muted">Check the card, then correct anything below if needed. You can also edit the card number.</p>
          </div>
        )}
        {!pending && <p className="mb-5 text-[12.5px] text-muted">{worker.email}{worker.phone ? ` · ${worker.phone}` : ''}{worker.shramikCardNumber ? ` · Card ${worker.shramikCardNumber}` : ''}</p>}

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="eyebrow text-[10px]">Skills</p>
            <div className="mt-3 space-y-2.5">{services.map((s) => <Toggle key={s.id} label={s.name} checked={form.serviceIds.includes(s.id)} onChange={(on) => setForm({ ...form, serviceIds: flip(form.serviceIds, s.id, on) })} />)}</div>
            {fieldError('serviceIds') && <p role="alert" className="mt-2 text-[12px] text-rust">{fieldError('serviceIds')}</p>}
          </div>
          <div>
            <p className="eyebrow text-[10px]">Service areas</p>
            <div className="mt-3 space-y-2.5">{AREAS.map((a) => <Toggle key={a} label={a} checked={form.areas.includes(a)} onChange={(on) => setForm({ ...form, areas: flip(form.areas, a, on) })} />)}</div>
            {fieldError('areas') && <p role="alert" className="mt-2 text-[12px] text-rust">{fieldError('areas')}</p>}
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">Availability
            <select value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} className={input}>{AVAILABILITY.map((a) => <option key={a}>{a}</option>)}</select>
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">Shramik card number
            <input value={form.shramikCardNumber} onChange={(e) => setForm({ ...form, shramikCardNumber: e.target.value })} className={input} />
            {fieldError('shramikCardNumber') && <span role="alert" className="mt-1 block text-[12px] font-normal normal-case tracking-normal text-rust">{fieldError('shramikCardNumber')}</span>}
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">Note (optional)
            <input value={form.note} maxLength={120} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. On leave this week" className={input} />
          </label>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          {pending ? (
            <>
              <Button arrow={false} disabled={busy} onClick={() => run(() => api.admin.approveWorker(worker.id, body()), 'Approved. The worker was notified.')}>Approve worker</Button>
              <button type="button" onClick={() => setDeclining((d) => !d)} className="border-b border-ink/50 pb-0.5 text-[12.5px] font-medium hover:border-rust hover:text-rust">Decline…</button>
            </>
          ) : (
            <>
              <Button arrow={false} disabled={busy} onClick={() => run(() => api.admin.updateWorkerProfile(worker.id, { ...body(), verified: form.verified }), 'Saved.')}>Save details</Button>
              {statusAction && <button type="button" disabled={busy} onClick={() => run(() => api.admin.setUserStatus(worker.id, statusAction[0]), `${statusAction[1]} done.`)} className="border-b border-ink/50 pb-0.5 text-[12.5px] font-medium hover:border-rust hover:text-rust">{statusAction[1]}</button>}
            </>
          )}
        </div>

        <AnimatePresence initial={false}>
          {declining && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-5 rounded-xl bg-white/60 p-4">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">Why? (the worker will see this)
                  <input value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Card photo is unclear" className={input} />
                </label>
                <div className="mt-4"><Button arrow={false} disabled={busy || reason.trim().length < 3} onClick={() => run(() => api.admin.declineWorker(worker.id, reason.trim()), 'Declined.')}>Decline worker</Button></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {problem && !problem.details?.length && <p role="alert" className="mt-4 text-[12.5px] text-rust">{problem.message}</p>}
        {message && <p role="status" className="mt-4 text-[12.5px] text-muted">{message}</p>}
      </div>
    </motion.div>
  )
}

export default function Workers() {
  const [open, setOpen] = useState(null)
  const { data, error, loading, reload } = useAsync(() => api.admin.workers(), [])
  const svc = useAsync(() => api.admin.services.list(), [])
  const all = data?.workers ?? []
  const waiting = all.filter((w) => w.status === 'pending').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const rest = all.filter((w) => w.status !== 'pending')
  const services = svc.data?.services ?? []
  const changed = () => reload({ silent: true })

  return (
    <>
      <AdminHeading title="People behind the work.">
        <p className="mt-10 max-w-[560px] text-[15px] leading-[1.7] text-muted">
          Skills, service areas and availability—visible to everyone coordinating the work. Member records here are real accounts; no rankings or scores.
        </p>
      </AdminHeading>

      <div className="mt-12">{loading && <Spinner label="Loading workers" />}{error && <ErrorNote error={error} onRetry={reload} />}</div>

      {waiting.length > 0 && (
        <section className="mb-16" aria-label="Workers waiting for approval">
          <h2 className="font-serif text-[30px] leading-tight">Waiting for your approval <span className="text-[15px] text-rust">({waiting.length})</span></h2>
          <p className="mt-1 text-[12.5px] text-muted">Check each person’s details and Shramik card, edit if needed, then approve.</p>
          <ul className="mt-6 border-t border-line">
            {waiting.map((w) => (
              <li key={w.id} className="border-b border-line">
                <div className="flex flex-wrap items-center justify-between gap-4 py-5">
                  <div>
                    <p className="font-serif text-[24px] leading-tight">{w.name}</p>
                    <p className="mt-1 text-[12.5px] text-muted">{w.phone} · {w.skills.join(', ') || 'No skills chosen'} · {w.areas.join(', ') || 'No areas'}</p>
                  </div>
                  <button type="button" aria-expanded={open === w.id} onClick={() => setOpen(open === w.id ? null : w.id)} className="border-b border-ink pb-0.5 text-[12.5px] font-medium hover:border-rust hover:text-rust">{open === w.id ? 'Close' : 'Review details'}</button>
                </div>
                <AnimatePresence initial={false}>{open === w.id && <WorkerPanel key={w.id} worker={w} services={services} onChanged={changed} />}</AnimatePresence>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!loading && !error && all.length === 0 && <p className="border-y border-line py-10 text-[14px] text-muted">No workers yet. People who sign up as workers appear here, waiting for your approval.</p>}

      {rest.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className={`hidden gap-4 border-t border-line py-4 sm:grid ${cols} eyebrow text-[10px]`}><span>Name</span><span>Skills</span><span>Service areas</span><span>Availability</span><span>Status</span><span>Details</span></div>
            {rest.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.05 + i * 0.05 }} className="border-t border-line">
                <div className={`grid gap-4 py-5 text-[13px] ${cols}`}>
                  <button type="button" aria-expanded={open === w.id} onClick={() => setOpen(open === w.id ? null : w.id)} className="w-fit border-b border-ink/50 text-left font-medium hover:border-rust hover:text-rust">{w.name}</button>
                  <span>{w.skills.join(', ') || <span className="text-muted">None yet</span>}</span>
                  <span>{w.areas.join(', ') || <span className="text-muted">None yet</span>}</span>
                  <span>{w.availability}{w.note && <span className="mt-1 block text-[11.5px] text-muted">{w.note}</span>}</span>
                  <span className="flex items-start gap-2"><span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-ink" />{STATUS_LABEL[w.status]}</span>
                  <span>{w.details}</span>
                </div>
                <AnimatePresence initial={false}>{open === w.id && <WorkerPanel key={`${w.id}-${w.status}-${w.availability}`} worker={w} services={services} onChanged={changed} />}</AnimatePresence>
              </motion.div>
            ))}
            <div className="border-t border-line" />
          </div>
        </div>
      )}
    </>
  )
}
