import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import PageHeading from './PageHeading'
import Button from '../../components/ui/Button'
import ErrorNote from '../../components/ui/ErrorNote'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'
import { todayIST } from '../../lib/format'

const ease = [0.22, 1, 0.36, 1]

const inputClass =
  'mt-2 w-full border-b border-ink/30 bg-transparent py-3 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-rust'

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold">
        {label}
        {children}
      </label>
      {error ? <p role="alert" className="mt-2 text-[12px] text-rust">{error}</p> : <p className="mt-2 text-[12px] text-muted">{hint}</p>}
    </div>
  )
}

// Which wizard step shows each server field when the server complains
const STEP_OF_FIELD = { details: 'details', address: 'address', date: 'schedule', time: 'schedule', contact: 'contact' }

export default function BookingWizard() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { data, error: loadError, loading, reload } = useAsync(() => api.services.catalogue(), [])

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ details: '', address: '', date: '', time: '', contact: '' })

  if (!state?.serviceId) return <Navigate to="/customer" replace />
  if (loading) return <Spinner label="Loading" />
  if (loadError) return <ErrorNote error={loadError} onRetry={reload} />

  const service = data.services.find((s) => s.id === state.serviceId)
  if (!service) return <Navigate to="/customer" replace />

  // "Ask only for what you need": the service decides which steps appear
  const steps = [
    ...(service.requires.details ? ['details'] : []),
    ...(service.requires.address ? ['address'] : []),
    ...(service.requires.schedule ? ['schedule'] : []),
    'contact',
    'review',
  ]
  const total = steps.length
  const current = steps[step]
  const today = todayIST()

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const validate = () => {
    const er = {}
    if (current === 'details' && form.details.trim().length < 5) er.details = 'Please describe the job in a few words.'
    if (current === 'address' && form.address.trim().length < 6) er.address = 'Please add the full address, including your area.'
    if (current === 'schedule') {
      if (!form.date) er.date = 'Choose a preferred date.'
      else if (form.date < today) er.date = 'Choose today or a later date.'
      if (!form.time) er.time = 'Choose a preferred time.'
    }
    if (current === 'contact' && !/^[6-9]\d{9}$/.test(form.contact.trim())) er.contact = 'Enter a 10-digit mobile number.'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  const go = (delta) => {
    if (delta > 0 && !validate()) return
    setDirection(delta)
    setStep((s) => s + delta)
  }

  const submit = async () => {
    setBusy(true)
    setSubmitError(null)
    try {
      const { booking } = await api.bookings.create({
        serviceId: service.id,
        contact: form.contact.trim(),
        ...(service.requires.details ? { details: form.details.trim() } : {}),
        ...(service.requires.address ? { address: form.address.trim() } : {}),
        ...(service.requires.schedule ? { date: form.date, time: form.time } : {}),
      })
      navigate(`/customer/bookings/${booking.id}`, { state: { created: true }, replace: true })
    } catch (err) {
      // Show the server's complaint on the step it belongs to
      const first = err.details?.[0]
      if (first && STEP_OF_FIELD[first.field]) {
        const target = steps.indexOf(STEP_OF_FIELD[first.field])
        if (target >= 0) {
          setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])))
          setDirection(-1)
          setStep(target)
        }
      }
      setSubmitError(err)
    } finally {
      setBusy(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault()
      current === 'review' ? submit() : go(1)
    }
  }

  const review = [
    ['Service', service.name],
    ...(service.requires.details ? [['Job details', form.details]] : []),
    ...(service.requires.address ? [['Address', form.address]] : []),
    ...(service.requires.schedule ? [['Preferred date', form.date], ['Preferred time', form.time]] : []),
    ['Contact', form.contact],
  ]

  return (
    <>
      <PageHeading title="A little detail. A clear start." />

      <div className="mt-10 max-w-[620px]">
        <div className="flex items-center justify-between text-[12px] text-muted">
          <span>{service.name}</span>
          <span>Step {step + 1} of {total}</span>
        </div>
        <div className="mt-3 flex gap-2" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1}>
          {steps.map((s, i) => (
            <div key={s} className="h-px flex-1 bg-ink/15">
              <motion.div className="h-[2px] -translate-y-px bg-ink" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.5, ease }} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 max-w-[620px]" onKeyDown={onKeyDown}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 28 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 * direction }}
            transition={{ duration: 0.35, ease }}
          >
            {current === 'details' && (
              <>
                <h2 className="font-serif text-[30px] leading-tight">What needs doing?</h2>
                <div className="mt-8">
                  <Field label="Job details" hint="A clear description helps the cooperative allocate the right skills." error={errors.details}>
                    <textarea rows={4} value={form.details} onChange={set('details')} className={`${inputClass} resize-y border border-ink/30 px-3 focus:border-rust`} autoFocus />
                  </Field>
                </div>
              </>
            )}

            {current === 'address' && (
              <>
                <h2 className="font-serif text-[30px] leading-tight">Where is the job?</h2>
                <div className="mt-8">
                  <Field label="Full address" hint="The assigned worker needs the exact location to reach you." error={errors.address}>
                    <input value={form.address} onChange={set('address')} placeholder="House number, street and Bhopal area" className={inputClass} autoFocus />
                  </Field>
                </div>
              </>
            )}

            {current === 'schedule' && (
              <>
                <h2 className="font-serif text-[30px] leading-tight">When works for you?</h2>
                <div className="mt-8 space-y-8">
                  <Field label="Preferred date" hint="This helps the cooperative plan availability; the slot is not guaranteed." error={errors.date}>
                    <input type="date" min={today} value={form.date} onChange={set('date')} className={inputClass} autoFocus />
                  </Field>
                  <Field label="Preferred time" hint="Tell us when you can be there to let the worker in." error={errors.time}>
                    <input type="time" value={form.time} onChange={set('time')} className={inputClass} />
                  </Field>
                </div>
              </>
            )}

            {current === 'contact' && (
              <>
                <h2 className="font-serif text-[30px] leading-tight">How can we reach you?</h2>
                <div className="mt-8">
                  <Field label="Contact number" hint="The cooperative needs a number to coordinate your booking." error={errors.contact}>
                    <input type="tel" inputMode="tel" value={form.contact} onChange={set('contact')} placeholder="Your 10-digit mobile number" className={inputClass} autoFocus />
                  </Field>
                </div>
              </>
            )}

            {current === 'review' && (
              <>
                <h2 className="font-serif text-[30px] leading-tight">Review your request</h2>
                <dl className="mt-8 text-[13.5px]">
                  {review.map(([k, v], i) => (
                    <motion.div key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4, ease }} className="grid grid-cols-[130px_1fr] gap-4 border-b border-line py-3.5 first:border-t">
                      <dt className="text-muted">{k}</dt>
                      <dd className="break-words">{v}</dd>
                    </motion.div>
                  ))}
                </dl>
                <p className="mt-6 max-w-[520px] text-[12px] leading-relaxed text-muted">
                  Your request starts as PENDING. The cooperative allocates a worker, and a human reviews the finished work.
                </p>
                {submitError && <p role="alert" className="mt-4 rounded-xl bg-rust/10 px-4 py-3 text-[13px] text-rust">{submitError.message}</p>}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between">
          <button type="button" onClick={() => (step === 0 ? navigate('/customer') : go(-1))} className="border-b border-ink pb-0.5 text-[13px] font-medium hover:border-rust hover:text-rust">
            Back
          </button>
          {current !== 'review' ? (
            <Button size="lg" onClick={() => go(1)}>Continue</Button>
          ) : (
            <Button size="lg" onClick={submit} disabled={busy}>{busy ? 'Submitting…' : 'Submit booking'}</Button>
          )}
        </div>
      </div>
    </>
  )
}
