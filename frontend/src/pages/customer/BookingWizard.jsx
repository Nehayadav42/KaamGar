import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import PageHeading from './PageHeading'
import Button from '../../components/ui/Button'
import { makeBooking, useBookings } from '../../context/BookingsContext'
import { useCatalogue } from '../../context/CatalogueContext'

const ease = [0.22, 1, 0.36, 1]
const TOTAL = 5

const inputClass =
  'mt-2 w-full border-b border-ink/30 bg-transparent py-3 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-rust'

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold">
        {label}
        {children}
      </label>
      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-rust">{error}</p>
      ) : (
        <p className="mt-2 text-[12px] text-muted">{hint}</p>
      )}
    </div>
  )
}

export default function BookingWizard() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { addBooking } = useBookings()
  const { services } = useCatalogue()


  const service = useMemo(() => services.find((s) => s.id === state?.serviceId), [state, services])
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({ details: '', address: '', date: '', time: '', contact: '' })

  // Opened directly (no service picked)? Send them to pick one first.
  if (!service) return <Navigate to="/customer" replace />

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const today = new Date().toISOString().slice(0, 10)

  const validate = () => {
    const er = {}
    if (step === 0 && form.details.trim().length < 5) er.details = 'Please describe the job in a few words.'
    if (step === 1 && form.address.trim().length < 6) er.address = 'Please add the full address, including your area.'
    if (step === 2) {
      if (!form.date) er.date = 'Choose a preferred date.'
      else if (form.date < today) er.date = 'Choose today or a later date.'
      if (!form.time) er.time = 'Choose a preferred time.'
    }
    if (step === 3 && form.contact.replace(/\D/g, '').length < 10) er.contact = 'Enter a 10-digit phone number.'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  const go = (delta) => {
    if (delta > 0 && !validate()) return
    setDirection(delta)
    setStep((s) => s + delta)
  }

  const submit = () => {
    const booking = makeBooking({ ...form, service: service.name })
    addBooking(booking)
    navigate(`/customer/bookings/${booking.id}`, { state: { created: true } })
  }

  const onKeyDown = (e) => {
    // Enter moves on (but not inside the multi-line box)
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault()
      step < TOTAL - 1 ? go(1) : submit()
    }
  }

  const review = [
    ['Service', service.name],
    ['Job details', form.details],
    ['Address', form.address],
    ['Preferred date', form.date],
    ['Preferred time', form.time],
    ['Contact', form.contact],
  ]

  return (
    <>
      <PageHeading title="A little detail. A clear start." />

      {/* Progress */}
      <div className="mt-10 max-w-[620px]">
        <div className="flex items-center justify-between text-[12px] text-muted">
          <span>{service.name}</span>
          <span>
            Step {step + 1} of {TOTAL}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2" role="progressbar" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step + 1}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <div key={i} className="h-px bg-ink/15">
              <motion.div
                className="h-[2px] -translate-y-px bg-ink"
                initial={false}
                animate={{ width: i <= step ? '100%' : '0%' }}
                transition={{ duration: 0.5, ease }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 max-w-[620px]" onKeyDown={onKeyDown}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: 28 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 * direction }}
            transition={{ duration: 0.35, ease }}
          >
            {step === 0 && (
              <>
                <h2 className="font-serif text-[30px] leading-tight">What needs doing?</h2>
                <div className="mt-8">
                  <Field label="Job details" hint="A clear description helps the cooperative allocate the right skills." error={errors.details}>
                    <textarea rows={4} value={form.details} onChange={set('details')} className={`${inputClass} resize-y border border-ink/30 px-3 focus:border-rust`} autoFocus />
                  </Field>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="font-serif text-[30px] leading-tight">Where is the job?</h2>
                <div className="mt-8">
                  <Field label="Full address" hint="The assigned worker needs the exact location to reach you." error={errors.address}>
                    <input value={form.address} onChange={set('address')} placeholder="House number, street and Bhopal area" className={inputClass} autoFocus />
                  </Field>
                </div>
              </>
            )}

            {step === 2 && (
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

            {step === 3 && (
              <>
                <h2 className="font-serif text-[30px] leading-tight">How can we reach you?</h2>
                <div className="mt-8">
                  <Field label="Contact number" hint="The cooperative needs a number to coordinate your booking." error={errors.contact}>
                    <input type="tel" inputMode="tel" value={form.contact} onChange={set('contact')} placeholder="Your phone number" className={inputClass} autoFocus />
                  </Field>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="font-serif text-[30px] leading-tight">Review your request</h2>
                <dl className="mt-8 text-[13.5px]">
                  {review.map(([k, v], i) => (
                    <motion.div
                      key={k}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.4, ease }}
                      className="grid grid-cols-[130px_1fr] gap-4 border-b border-line py-3.5 first:border-t"
                    >
                      <dt className="text-muted">{k}</dt>
                      <dd className="break-words">{v}</dd>
                    </motion.div>
                  ))}
                </dl>
                <p className="mt-6 max-w-[520px] text-[12px] leading-relaxed text-muted">
                  Your request starts as PENDING. Allocation and human review happen separately. This
                  prototype saves locally only.
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => (step === 0 ? navigate('/customer') : go(-1))}
            className="border-b border-ink pb-0.5 text-[13px] font-medium hover:border-rust hover:text-rust"
          >
            Back
          </button>
          {step < TOTAL - 1 ? (
            <Button size="lg" onClick={() => go(1)}>Continue</Button>
          ) : (
            <Button size="lg" onClick={submit}>Submit booking</Button>
          )}
        </div>
      </div>
    </>
  )
}
