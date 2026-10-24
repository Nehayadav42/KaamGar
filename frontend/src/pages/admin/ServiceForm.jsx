import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import AdminHeading from './AdminHeading'
import Button from '../../components/ui/Button'
import ErrorNote from '../../components/ui/ErrorNote'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'
import { AREAS } from '../../lib/constants'
import { fmtDateTime } from '../../lib/format'

const blank = {
  name: '',
  category: '',
  description: '',
  areas: [],
  requires: { details: true, address: true, schedule: true },
  evidence: { before: true, after: true, notes: true },
}

const inputClass =
  'mt-2 w-full border-b border-ink/30 bg-transparent py-3 text-[15px] font-normal outline-none transition-colors placeholder:text-faint focus:border-rust'

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

function Tick({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer gap-4 border-b border-line py-4 first:border-t">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="mt-0.5 grid size-4 shrink-0 place-items-center border border-ink/60 text-white transition-colors peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-rust [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100">
        <Check size={11} strokeWidth={3} />
      </span>
      <span>
        <span className="block text-[13.5px] font-medium">{label}</span>
        <span className="mt-0.5 block text-[12px] text-muted">{hint}</span>
      </span>
    </label>
  )
}

function Section({ n, label, title, children }) {
  return (
    <section className="mt-14 border-t border-line pt-10 first:mt-10 first:border-t-0 first:pt-0">
      <p className="eyebrow text-[10px]">{n} · {label}</p>
      <h2 className="mt-3 font-serif text-[30px] leading-tight">{title}</h2>
      <div className="mt-8">{children}</div>
    </section>
  )
}

const pick = (s) => ({ name: s.name, category: s.category, description: s.description, areas: s.areas, requires: s.requires, evidence: s.evidence })

// Loads the service when editing, then hands it to the editor
export default function ServiceForm() {
  const { id } = useParams()
  const { state } = useLocation()
  const [notice, setNotice] = useState(state?.saved ? 'Service saved as Inactive.' : '')
  const { data, error, loading, reload } = useAsync(() => (id ? api.admin.services.get(id) : Promise.resolve(null)), [id])

  if (id && loading) return <><AdminHeading title="Shape the service." /><div className="mt-12"><Spinner label="Loading service" /></div></>
  if (id && error?.status === 404) return <Navigate to="/admin/services" replace />
  if (id && error) return <><AdminHeading title="Shape the service." /><div className="mt-12"><ErrorNote error={error} onRetry={reload} /></div></>

  const service = data?.service ?? null
  // key: after every save the editor starts again from what the server stored
  return <Editor key={service ? `${service.id}-${service.updatedAt}` : 'new'} service={service} notice={notice} setNotice={setNotice} reload={reload} />
}

function Editor({ service, notice, setNotice, reload }) {
  const navigate = useNavigate()
  const isNew = !service
  const initial = service ? pick(service) : blank
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  const touch = () => setNotice('')

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
    touch()
  }
  const toggleIn = (group, key) => (checked) => { setForm((f) => ({ ...f, [group]: { ...f[group], [key]: checked } })); touch() }
  const toggleArea = (area) => (checked) => { setForm((f) => ({ ...f, areas: checked ? [...f.areas, area] : f.areas.filter((a) => a !== area) })); touch() }

  const save = async (e) => {
    e.preventDefault()
    const er = {}
    if (form.name.trim().length < 3) er.name = 'Give the service a clear name.'
    if (!form.category.trim()) er.category = 'Add a category so related work stays together.'
    setErrors(er)
    if (Object.keys(er).length) return

    const body = { ...form, name: form.name.trim(), category: form.category.trim(), description: form.description.trim() }
    setBusy(true)
    try {
      if (isNew) {
        const { service: created } = await api.admin.services.create(body)
        navigate(`/admin/services/${created.id}`, { state: { saved: true }, replace: true })
      } else {
        await api.admin.services.update(service.id, body)
        setNotice('Changes saved.')
        await reload({ silent: true })
      }
    } catch (err) {
      const fe = Object.fromEntries((err.details ?? []).map((d) => [d.field, d.message]))
      setErrors(fe)
      if (!Object.keys(fe).length) setNotice(err.message)
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async () => {
    if (dirty) return setNotice('Save your edits before changing availability.')
    setBusy(true)
    try {
      await (service.active ? api.admin.services.deactivate(service.id) : api.admin.services.activate(service.id))
      setNotice(service.active ? 'Service deactivated.' : 'Service activated.')
      await reload({ silent: true })
    } catch (err) {
      setNotice(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AdminHeading title={isNew ? 'Add a service.' : 'Shape the service.'} />

      <Link to="/admin/services" className="mt-8 inline-block border-b border-ink pb-0.5 text-[12.5px] font-medium hover:border-rust hover:text-rust">← Services</Link>

      <div className="mt-10 grid gap-16 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-24">
        <form onSubmit={save} noValidate>
          <Section n="01" label="Basics" title="A clear service, in plain words.">
            <div className="space-y-8">
              <Field label="Service name" hint="Use a specific name customers recognise, such as Faucet repair." error={errors.name}>
                <input value={form.name} onChange={set('name')} className={inputClass} />
              </Field>
              <Field label="Category" hint="Groups related work, such as Plumbing, Electrical or Cleaning." error={errors.category}>
                <input value={form.category} onChange={set('category')} className={inputClass} />
              </Field>
              <Field label="Description" hint="Explains what this service includes before a customer books." error={errors.description}>
                <textarea rows={3} value={form.description} onChange={set('description')} className={`${inputClass} resize-y`} />
              </Field>
            </div>
          </Section>

          <Section n="02" label="Where it’s offered" title="Keep the coverage honest.">
            <p className="text-[12.5px] font-semibold">Areas covered</p>
            <p className="mb-4 mt-1 text-[12px] text-muted">Choose areas your cooperative can actually serve. These appear in the Customer catalogue.</p>
            {AREAS.map((a) => (
              <Tick key={a} checked={form.areas.includes(a)} onChange={toggleArea(a)} label={a} hint={`Customers in ${a} can request this service.`} />
            ))}
          </Section>

          <Section n="03" label="Customer booking requirements" title="Ask only for what you need.">
            <p className="mb-4 text-[12.5px] font-semibold">What the customer must provide</p>
            <Tick checked={form.requires.details} onChange={toggleIn('requires', 'details')} label="Job details" hint="Describes the work so the cooperative can match the right skills." />
            <Tick checked={form.requires.address} onChange={toggleIn('requires', 'address')} label="Address" hint="Gives the worker the exact place to visit." />
            <Tick checked={form.requires.schedule} onChange={toggleIn('requires', 'schedule')} label="Preferred date and time" hint="Helps the cooperative plan a visit; the requested slot is not guaranteed." />
            <p className="mt-4 text-[12px] text-muted">Without an address or schedule, allocation may need a customer correction. The customer’s booking steps follow these choices.</p>
          </Section>

          <Section n="04" label="Worker evidence" title="Make the record useful.">
            <p className="mb-4 text-[12.5px] font-semibold">Evidence the worker must submit</p>
            <Tick checked={form.evidence.before} onChange={toggleIn('evidence', 'before')} label="Before photo" hint="Records the condition before work starts." />
            <Tick checked={form.evidence.after} onChange={toggleIn('evidence', 'after')} label="After photo" hint="Records the condition after the job is finished." />
            <Tick checked={form.evidence.notes} onChange={toggleIn('evidence', 'notes')} label="Notes" hint="Explains what was done for a human cooperative reviewer." />
            <p className="mt-4 text-[12px] text-muted">Humans decide verification; worker evidence submission is not built yet.</p>
          </Section>

          <div className="mt-14 flex items-center justify-between border-t border-line pt-8">
            <Link to="/admin/services" className="border-b border-ink pb-0.5 text-[13px] font-medium hover:border-rust hover:text-rust">Back to Services</Link>
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {notice && <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-[12px] text-muted" role="status">{notice}</motion.span>}
              </AnimatePresence>
              <Button type="submit" arrow={false} size="lg" disabled={busy}>{isNew ? 'Save service' : 'Save changes'}</Button>
            </div>
          </div>

          {!isNew && (
            <section className="mt-16 border-t border-line pt-8">
              <p className="eyebrow text-[10px]">Service activity</p>
              <ul className="mt-5">
                {service.activity.map((a, i) => (
                  <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-3 text-[12.5px]">
                    <span>{a.text}</span>
                    <span className="text-[11.5px] text-muted">{fmtDateTime(a.at)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </form>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="border-t border-line pt-5">
            <p className="eyebrow text-[10px]">Catalogue availability</p>
            {isNew ? (
              <>
                <h3 className="mt-5 font-serif text-[26px] leading-tight">— Inactive until saved</h3>
                <p className="mt-5 text-[12.5px] leading-relaxed text-muted">New services are saved as inactive. You can activate them after reviewing the details.</p>
              </>
            ) : (
              <>
                <h3 className="mt-5 font-serif text-[26px] leading-tight">— {service.active ? 'Active' : 'Inactive'}</h3>
                <p className="mt-5 text-[12.5px] leading-relaxed text-muted">
                  {service.active ? 'Visible in the Customer catalogue.' : 'Hidden from the Customer catalogue. Existing bookings are not removed.'}
                </p>
                <button type="button" disabled={busy} onClick={toggleActive} className="mt-5 border-b border-ink pb-0.5 text-[12.5px] font-medium hover:border-rust hover:text-rust disabled:opacity-50">
                  {service.active ? 'Deactivate service' : 'Activate service'}
                </button>
              </>
            )}
            <p className="mt-6 text-[12px] leading-relaxed text-muted">
              Availability changes are explicit and logged. Save form edits before changing availability; unsaved edits do not publish.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
