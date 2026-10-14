import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import AdminHeading from './AdminHeading'
import Button from '../../components/ui/Button'
import { useCatalogue } from '../../context/CatalogueContext'
import { AREAS } from '../../data/admin'

const blank = {
  name: '',
  category: '',
  desc: '',
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
      {error ? (
        <p role="alert" className="mt-2 text-[12px] text-rust">{error}</p>
      ) : (
        <p className="mt-2 text-[12px] text-muted">{hint}</p>
      )}
    </div>
  )
}

function Check_({ checked, onChange, label, hint }) {
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

const slug = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export default function ServiceForm() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { services, addService, updateService, setServiceActive } = useCatalogue()

  const existing = id ? services.find((s) => s.id === id) : null
  const isNew = !id

  const initial = useMemo(
    () => (existing ? { name: existing.name, category: existing.category, desc: existing.desc, areas: existing.areas, requires: existing.requires, evidence: existing.evidence } : blank),
    [existing],
  )
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(state?.saved ? 'Service saved as Inactive.' : '')

  if (!isNew && !existing) return <Navigate to="/admin/services" replace />

  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
    setNotice('')
  }
  const toggleIn = (group, key) => (checked) => {
    setForm((f) => ({ ...f, [group]: { ...f[group], [key]: checked } }))
    setNotice('')
  }
  const toggleArea = (area) => (checked) => {
    setForm((f) => ({ ...f, areas: checked ? [...f.areas, area] : f.areas.filter((a) => a !== area) }))
    setNotice('')
  }

  const validate = () => {
    const er = {}
    if (form.name.trim().length < 3) er.name = 'Give the service a clear name.'
    if (!form.category.trim()) er.category = 'Add a category so related work stays together.'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  const save = (e) => {
    e.preventDefault()
    if (!validate()) return
    const clean = { ...form, name: form.name.trim(), category: form.category.trim(), desc: form.desc.trim() }
    if (isNew) {
      const newId = `${slug(clean.name)}-${Math.floor(Math.random() * 900 + 100)}`
      addService({ id: newId, ...clean })
      navigate(`/admin/services/${newId}`, { state: { saved: true }, replace: true })
    } else {
      updateService(existing.id, clean)
      setNotice('Changes saved.')
    }
  }

  const toggleActive = () => {
    if (dirty) {
      setNotice('Save your edits before changing availability.')
      return
    }
    if (!existing.active && existing.areas.length === 0) {
      setNotice('Choose at least one area and save before activating.')
      return
    }
    setServiceActive(existing.id, !existing.active)
    setNotice(existing.active ? 'Service deactivated.' : 'Service activated.')
  }

  return (
    <>
      <AdminHeading title={isNew ? 'Add a service.' : 'Shape the service.'} />

      <Link to="/admin/services" className="mt-8 inline-block border-b border-ink pb-0.5 text-[12.5px] font-medium hover:border-rust hover:text-rust">
        ← Services
      </Link>

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
              <Field label="Description" hint="Explains what this service includes before a customer books.">
                <textarea rows={3} value={form.desc} onChange={set('desc')} className={`${inputClass} resize-y`} />
              </Field>
            </div>
          </Section>

          <Section n="02" label="Where it’s offered" title="Keep the coverage honest.">
            <p className="text-[12.5px] font-semibold">Areas covered</p>
            <p className="mb-4 mt-1 text-[12px] text-muted">
              Choose areas your cooperative can actually serve. These appear in the Customer catalogue.
            </p>
            {AREAS.map((a) => (
              <Check_ key={a} checked={form.areas.includes(a)} onChange={toggleArea(a)} label={a} hint={`Customers in ${a} can request this service.`} />
            ))}
          </Section>

          <Section n="03" label="Customer booking requirements" title="Ask only for what you need.">
            <p className="mb-4 text-[12.5px] font-semibold">What the customer must provide</p>
            <Check_ checked={form.requires.details} onChange={toggleIn('requires', 'details')} label="Job details" hint="Describes the work so the cooperative can match the right skills." />
            <Check_ checked={form.requires.address} onChange={toggleIn('requires', 'address')} label="Address" hint="Gives the worker the exact place to visit." />
            <Check_ checked={form.requires.schedule} onChange={toggleIn('requires', 'schedule')} label="Preferred date and time" hint="Helps the cooperative plan a visit; the requested slot is not guaranteed." />
            <p className="mt-4 text-[12px] text-muted">Without an address or schedule, allocation may need a customer correction.</p>
          </Section>

          <Section n="04" label="Worker evidence" title="Make the record useful.">
            <p className="mb-4 text-[12.5px] font-semibold">Evidence the worker must submit</p>
            <Check_ checked={form.evidence.before} onChange={toggleIn('evidence', 'before')} label="Before photo" hint="Records the condition before work starts." />
            <Check_ checked={form.evidence.after} onChange={toggleIn('evidence', 'after')} label="After photo" hint="Records the condition after the job is finished." />
            <Check_ checked={form.evidence.notes} onChange={toggleIn('evidence', 'notes')} label="Notes" hint="Explains what was done for a human cooperative reviewer." />
            <p className="mt-4 text-[12px] text-muted">
              Requirements are saved with new bookings. Humans decide verification; worker evidence submission is not built yet.
            </p>
          </Section>

          <div className="mt-14 flex items-center justify-between border-t border-line pt-8">
            <Link to="/admin/services" className="border-b border-ink pb-0.5 text-[13px] font-medium hover:border-rust hover:text-rust">
              Back to Services
            </Link>
            <div className="flex items-center gap-4">
              <AnimatePresence>
                {notice && (
                  <motion.span initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-[12px] text-muted" role="status">
                    {notice}
                  </motion.span>
                )}
              </AnimatePresence>
              <Button type="submit" arrow={false} size="lg">
                {isNew ? 'Save service' : 'Save changes'}
              </Button>
            </div>
          </div>

          {!isNew && (
            <section className="mt-16 border-t border-line pt-8">
              <p className="eyebrow text-[10px]">Service activity</p>
              <ul className="mt-5">
                {[...existing.activity].reverse().map((a, i) => (
                  <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line py-3 text-[12.5px]">
                    <span>{a.text}</span>
                    <span className="text-[11.5px] text-muted">{a.at}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </form>

        {/* Catalogue availability */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="border-t border-line pt-5">
            <p className="eyebrow text-[10px]">Catalogue availability</p>
            {isNew ? (
              <>
                <h3 className="mt-5 font-serif text-[26px] leading-tight">— Inactive until saved</h3>
                <p className="mt-5 text-[12.5px] leading-relaxed text-muted">
                  New services are saved as inactive. You can activate them after reviewing the details.
                </p>
              </>
            ) : (
              <>
                <h3 className="mt-5 font-serif text-[26px] leading-tight">— {existing.active ? 'Active' : 'Inactive'}</h3>
                <p className="mt-5 text-[12.5px] leading-relaxed text-muted">
                  {existing.active
                    ? 'Visible in the Customer catalogue.'
                    : 'Hidden from the Customer catalogue. Existing bookings are not removed.'}
                </p>
                <button
                  type="button"
                  onClick={toggleActive}
                  className="mt-5 border-b border-ink pb-0.5 text-[12.5px] font-medium hover:border-rust hover:text-rust"
                >
                  {existing.active ? 'Deactivate service' : 'Activate service'}
                </button>
              </>
            )}
            <p className="mt-6 text-[12px] leading-relaxed text-muted">
              Availability changes are explicit and logged. Save form edits before changing availability; unsaved
              edits do not publish.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}