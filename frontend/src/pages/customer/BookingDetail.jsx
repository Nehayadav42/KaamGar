import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeading from './PageHeading'
import Button from '../../components/ui/Button'
import ErrorNote from '../../components/ui/ErrorNote'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'
import { fmtDateTime, fmtVisit, statusLabel, verificationLabel } from '../../lib/format'

const ease = [0.22, 1, 0.36, 1]

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 border-b border-line py-3 text-[13px] first:border-t">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  )
}

function ReviewForm({ service, busy, error, onSave, onSkip }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease }} className="glass-soft rounded-2xl p-6">
      <h3 className="font-serif text-[24px]">{service}</h3>
      <p className="mt-5 text-[12.5px] font-semibold">Your rating</p>
      <div className="mt-3 flex gap-3" role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} out of 5`}
            whileTap={{ scale: 0.92 }}
            onClick={() => setRating(n)}
            className={`grid size-10 place-items-center rounded-full border text-[13px] transition-colors ${rating === n ? 'border-ink bg-ink text-white' : 'border-ink/25 hover:border-ink'}`}
          >
            {n}
          </motion.button>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] text-muted">1 — Not satisfied · 5 — Very satisfied. This is your review, not a worker score.</p>

      <label className="mt-6 block text-[12.5px] font-semibold">
        Comment (optional)
        <textarea rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Anything you’d like to share?" className="mt-2 w-full resize-y border-b border-ink/30 bg-transparent py-2 text-[14px] font-normal outline-none placeholder:text-faint focus:border-rust" />
      </label>

      {error && <p role="alert" className="mt-4 text-[12.5px] text-rust">{error.message}</p>}

      <div className="mt-6 flex items-center justify-between">
        <button type="button" disabled={busy} onClick={onSkip} className="border-b border-ink pb-0.5 text-[13px] font-medium hover:border-rust hover:text-rust disabled:opacity-50">
          Skip for now
        </button>
        <Button arrow={false} disabled={!rating || busy} onClick={() => onSave({ rating, ...(comment.trim() ? { comment: comment.trim() } : {}) })}>
          {busy ? 'Saving…' : 'Save review'}
        </Button>
      </div>
    </motion.div>
  )
}

export default function BookingDetail() {
  const { id } = useParams()
  const { state } = useLocation()
  const { data, error, loading, reload } = useAsync(() => api.bookings.get(id), [id])
  const [reviewing, setReviewing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmError, setConfirmError] = useState(null)
  const [bannerOpen, setBannerOpen] = useState(Boolean(state?.created))

  if (loading) return <Spinner label="Loading booking" />
  if (error?.status === 404 || error?.status === 400) {
    return (
      <div>
        <PageHeading title="Booking not found." />
        <Link to="/customer/bookings" className="mt-8 inline-block border-b border-ink pb-0.5 text-[13px] font-medium">← My bookings</Link>
      </div>
    )
  }
  if (error) return <ErrorNote error={error} onRetry={reload} />

  const booking = data.booking
  const canConfirm = booking.status === 'COMPLETED' && booking.confirmation === 'PENDING'
  const confirmed = booking.confirmation === 'CONFIRMED'

  const confirm = async (body) => {
    setBusy(true)
    setConfirmError(null)
    try {
      await api.bookings.confirm(booking.id, body)
      setReviewing(false)
      await reload({ silent: true })
    } catch (err) {
      setConfirmError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AnimatePresence>
        {bannerOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
            <div className="glass-soft rounded-2xl px-5 py-4 text-[13px]">
              Booking submitted. The cooperative will arrange a worker; your preferred visit time is not yet confirmed.{' '}
              <button type="button" onClick={() => setBannerOpen(false)} className="ml-2 border-b border-ink font-medium">Dismiss</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeading title={booking.service} />
      <p className="mt-3 text-[11px] font-medium tracking-[0.1em] text-muted">{booking.ref}</p>

      <Link to="/customer/bookings" className="mt-8 inline-flex items-center gap-1.5 border-b border-ink pb-0.5 text-[12.5px] font-medium hover:border-rust hover:text-rust">
        <ArrowLeft size={13} /> My bookings
      </Link>

      <div className="mt-12 grid gap-14 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="eyebrow text-[10.5px]">Request history</p>
          <ol className="mt-5 border-l border-line pl-6">
            {booking.history.map((h, i) => (
              <motion.li key={`${h.label}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease }} className="relative pb-6">
                <span className="absolute -left-[28.5px] top-1.5 size-1.5 rounded-full bg-ink" />
                <p className="text-[13.5px] font-medium">{h.label} · {h.status}</p>
                <p className="mt-0.5 text-[11.5px] text-muted">{fmtDateTime(h.at)}</p>
              </motion.li>
            ))}
          </ol>

          <section className="mt-10">
            <h2 className="font-serif text-[26px]">Assigned worker</h2>
            {booking.worker ? (
              <div className="mt-3 space-y-0.5 text-[13.5px]">
                <p>{booking.worker.name}</p>
                {booking.worker.skills.length > 0 && <p>{booking.worker.skills.join(', ')}</p>}
                <p>{booking.worker.cooperative}</p>
              </div>
            ) : (
              <p className="mt-3 max-w-[420px] text-[13.5px] leading-relaxed text-muted">Not assigned yet. Your cooperative will allocate a worker with the right skills.</p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-[26px]">Evidence summary</h2>
            <p className="mt-3 max-w-[420px] text-[13.5px] leading-relaxed text-muted">No before-and-after photos have been submitted yet.</p>
            <dl className="mt-6">
              {booking.details && <Row label="Job details" value={booking.details} />}
              {booking.address && <Row label="Address" value={booking.address} />}
              <Row label="Preferred visit" value={fmtVisit(booking.date, booking.time)} />
            </dl>
          </section>
        </div>

        <aside>
          <dl className="border-b border-line pb-4 text-[13px]">
            {[
              ['Job Status', statusLabel(booking.status)],
              ['Verification', verificationLabel(booking.verification)],
              ['Your confirmation', booking.confirmation],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1.5">
                <dt className="text-muted">{k}</dt>
                <dd className="flex items-center gap-2"><span className="size-1 rounded-full bg-ink" /> {v}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-8 border-b border-line pb-8">
            <h2 className="font-serif text-[24px]">Verification</h2>
            <p className="mt-2 text-[13.5px] font-medium">{verificationLabel(booking.verification)}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">A human cooperative reviewer decides verification. This section is information only.</p>
          </section>

          <section className="mt-8">
            <h2 className="font-serif text-[24px]">Confirm completion</h2>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              Your confirmation says the work is finished. It is separate from the cooperative’s verification.
            </p>

            <div className="mt-5">
              <AnimatePresence mode="wait" initial={false}>
                {reviewing ? (
                  <ReviewForm key="review" service={booking.service} busy={busy} error={confirmError} onSave={confirm} onSkip={() => confirm({})} />
                ) : confirmed ? (
                  <motion.p key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13.5px] font-medium">
                    You confirmed this job{booking.review ? ` · rated ${booking.review.rating}/5` : ''}. Thank you.
                  </motion.p>
                ) : (
                  <motion.div key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    <Button arrow={false} disabled={!canConfirm} onClick={() => setReviewing(true)}>Confirm completion</Button>
                    <span className="text-[12px] text-muted">Report a problem · Coming soon</span>
                  </motion.div>
                )}
              </AnimatePresence>
              {!canConfirm && !confirmed && (
                <p className="mt-3 text-[12px] leading-relaxed text-muted">Available once the cooperative marks the job COMPLETED.</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}
