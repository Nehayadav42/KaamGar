import { useState } from 'react'
import PlatformHeading from './PlatformHeading'
import Button from '../../components/ui/Button'
import ErrorNote from '../../components/ui/ErrorNote'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'
import { fmtDateTime } from '../../lib/format'

const fieldClass = 'mt-1 w-full border-b border-ink/25 bg-transparent py-2.5 text-[14px] font-normal normal-case tracking-normal outline-none placeholder:text-faint focus:border-rust'

export default function Cooperatives() {
  const { data, error, loading, reload } = useAsync(() => api.admin.cooperatives.list(), [])
  const [form, setForm] = useState({ name: '', area: '' })
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState(null)

  const create = async (e) => {
    e.preventDefault()
    setBusy(true); setProblem(null)
    try {
      await api.admin.cooperatives.create({ name: form.name, ...(form.area ? { area: form.area } : {}) })
      setForm({ name: '', area: '' })
      await reload({ silent: true })
    } catch (err) { setProblem(err) } finally { setBusy(false) }
  }

  return (
    <>
      <PlatformHeading title="Cooperatives."><p className="mt-6 max-w-[560px] text-[15px] leading-[1.7] text-muted">The pilot runs with one cooperative. Add another when a new one joins, then invite its admin.</p></PlatformHeading>
      <form onSubmit={create} noValidate className="glass mt-12 rounded-3xl p-6 sm:p-8">
        <p className="eyebrow text-[10.5px]">Add a cooperative</p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Indore Shramik Cooperative" className={fieldClass} required /></label>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">City or area (optional)<input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Indore" className={fieldClass} /></label>
        </div>
        {problem && <p role="alert" className="mt-5 rounded-xl bg-rust/10 px-4 py-3 text-[13px] text-rust">{problem.details?.[0]?.message ?? problem.message}</p>}
        <div className="mt-6"><Button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add cooperative'}</Button></div>
      </form>
      <div className="mt-12">{loading && <Spinner label="Loading" />}{error && <ErrorNote error={error} onRetry={reload} />}</div>
      {data && (
        <ul className="border-t border-line">
          {data.cooperatives.map((c) => (
            <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line py-6">
              <div><p className="font-serif text-[24px] leading-tight">{c.name}</p><p className="mt-1 text-[12.5px] text-muted">{c.area ?? 'No area set'}</p></div>
              <p className="text-[12px] text-muted">{c.active ? 'Active' : 'Inactive'} · added {fmtDateTime(c.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
