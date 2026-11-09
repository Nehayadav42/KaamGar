import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '../../components/ui/Button'
import ErrorNote from '../../components/ui/ErrorNote'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'
import { fmtVisit } from '../../lib/format'

const ease = [0.22, 1, 0.36, 1]

const GROUPS = [
  ['ASSIGNED', 'Offered to you', 'Accept the jobs you can do.'],
  ['ACCEPTED', 'Coming up', 'Start when you reach the customer.'],
  ['IN_PROGRESS', 'In progress', 'Mark it finished when the work is done.'],
  ['COMPLETED', 'Done', 'Waiting for the customer and the cooperative.'],
]

function JobCard({ job, onChanged }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')

  const run = async (fn) => {
    setBusy(true); setError(null)
    try { await fn(); setDeclining(false); await onChanged() } catch (err) { setError(err) } finally { setBusy(false) }
  }

  return (
    <motion.li layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="glass rounded-3xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-[26px] leading-tight">{job.service}</h3>
        <span className="text-[11px] font-medium tracking-[0.1em] text-muted">{job.ref}</span>
      </div>
      <dl className="mt-4 space-y-1.5 text-[13px]">
        <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">When</dt><dd>{fmtVisit(job.date, job.time)}</dd></div>
        <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">Where</dt><dd>{job.address}</dd></div>
        <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">Customer</dt><dd>{job.customerName}{job.contact && <> · <a href={`tel:${job.contact}`} className="border-b border-ink/50 hover:border-rust hover:text-rust">{job.contact}</a></>}</dd></div>
        {job.details && <div className="flex gap-3"><dt className="w-20 shrink-0 text-muted">Job</dt><dd>{job.details}</dd></div>}
      </dl>
      {job.status === 'ASSIGNED' && <p className="mt-3 text-[12px] text-muted">The customer’s phone number appears after you accept.</p>}

      {error && <p role="alert" className="mt-4 text-[12.5px] text-rust">{error.message}</p>}

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        {job.status === 'ASSIGNED' && (
          <>
            <Button arrow={false} disabled={busy} onClick={() => run(() => api.worker.accept(job.id))}>I’m taking this</Button>
            <button type="button" onClick={() => setDeclining((d) => !d)} className="border-b border-ink/50 pb-0.5 text-[12.5px] font-medium hover:border-rust hover:text-rust">I can’t do this</button>
          </>
        )}
        {job.status === 'ACCEPTED' && (
          <>
            <Button arrow={false} disabled={busy} onClick={() => run(() => api.worker.start(job.id))}>Start work</Button>
            <button type="button" onClick={() => setDeclining((d) => !d)} className="border-b border-ink/50 pb-0.5 text-[12.5px] font-medium hover:border-rust hover:text-rust">Give the job back</button>
          </>
        )}
        {job.status === 'IN_PROGRESS' && <Button arrow={false} disabled={busy} onClick={() => run(() => api.worker.finish(job.id))}>Mark as finished</Button>}
        {job.status === 'COMPLETED' && <span className="text-[12.5px] text-muted">{job.confirmation === 'CONFIRMED' ? 'The customer confirmed this job.' : 'Waiting for the customer to confirm.'}</span>}
      </div>

      <AnimatePresence initial={false}>
        {declining && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-5 rounded-2xl bg-white/50 p-4">
              <label className="block text-[12px] font-semibold">Reason (optional)
                <input value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="So the cooperative can plan" className="mt-1 w-full border-b border-ink/30 bg-transparent py-2 text-[13px] font-normal outline-none placeholder:text-faint focus:border-rust" />
              </label>
              <div className="mt-4 flex items-center gap-5">
                <Button arrow={false} disabled={busy} onClick={() => run(() => api.worker.decline(job.id, reason.trim()))}>Give it back</Button>
                <button type="button" onClick={() => setDeclining(false)} className="text-[12.5px] text-muted underline">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

export default function Jobs() {
  const { data, error, loading, reload } = useAsync(() => api.worker.jobs({ limit: 50 }), [])
  const jobs = data?.jobs ?? []

  return (
    <>
      <p className="eyebrow text-[10.5px]">Your work</p>
      <h1 className="mt-3 font-serif text-[48px] leading-[1.02] tracking-[-0.03em] sm:text-[60px]">My jobs.</h1>
      <div className="mt-10">{loading && <Spinner label="Loading your jobs" />}{error && <ErrorNote error={error} onRetry={reload} />}</div>
      {!loading && !error && jobs.length === 0 && (
        <div className="border-y border-line py-12"><p className="font-serif text-[26px]">No jobs yet.</p><p className="mt-2 text-[13px] text-muted">When your cooperative gives you a job, it appears here and you get a notification.</p></div>
      )}
      {GROUPS.map(([status, title, hint]) => {
        const list = jobs.filter((j) => j.status === status)
        if (!list.length) return null
        return (
          <section key={status} className="mt-12">
            <h2 className="font-serif text-[28px] leading-tight">{title} <span className="text-[14px] text-muted">({list.length})</span></h2>
            <p className="mt-1 text-[12.5px] text-muted">{hint}</p>
            <ul className="mt-5 space-y-4">{list.map((j) => <JobCard key={`${j.id}-${j.status}`} job={j} onChanged={() => reload({ silent: true })} />)}</ul>
          </section>
        )
      })}
    </>
  )
}
