import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PlatformHeading from './PlatformHeading'
import Button from '../../components/ui/Button'
import ErrorNote from '../../components/ui/ErrorNote'
import Spinner from '../../components/ui/Spinner'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'
import { fmtDateTime } from '../../lib/format'

const ease = [0.22, 1, 0.36, 1]
const fieldClass = 'mt-1 w-full border-b border-ink/25 bg-transparent py-2.5 text-[14px] font-normal normal-case tracking-normal outline-none placeholder:text-faint focus:border-rust'

function Result({ result, onClose }) {
  const copy = () => navigator.clipboard?.writeText(result.devLink).catch(() => {})
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-soft mt-6 rounded-2xl p-5 text-[13px]" role="status">
      <p className="font-medium">{result.emailSent ? `Email sent to ${result.email}.` : `The email to ${result.email} could not be sent.`}</p>
      <p className="mt-1 text-muted">{result.emailSent ? 'The link works for 2 days and only once.' : 'Check the email settings in the backend, then use “Resend invitation”.'}</p>
      {result.devLink && (
        <div className="mt-4 rounded-xl bg-white/60 p-3">
          <p className="eyebrow text-[10px]">Development only: the link</p>
          <p className="mt-1 break-all text-[12px]">{result.devLink}</p>
          <button type="button" onClick={copy} className="mt-2 border-b border-ink pb-0.5 text-[12px] font-medium">Copy link</button>
        </div>
      )}
      <button type="button" onClick={onClose} className="mt-4 text-[12px] text-muted underline">Close</button>
    </motion.div>
  )
}

export default function CoopAdmins() {
  const list = useAsync(() => api.admin.coopAdmins.list(), [])
  const coops = useAsync(() => api.admin.cooperatives.list(), [])
  const [form, setForm] = useState({ name: '', email: '', phone: '', cooperativeId: '' })
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const cooperatives = coops.data?.cooperatives ?? []
  const coopId = form.cooperativeId || cooperatives[0]?.id || ''
  const fieldError = (n) => error?.details?.find((d) => d.field === n)?.message

  const invite = async (e) => {
    e.preventDefault()
    setBusy('invite'); setError(null); setResult(null)
    try {
      const d = await api.admin.coopAdmins.invite({ name: form.name, email: form.email, cooperativeId: coopId, ...(form.phone ? { phone: form.phone } : {}) })
      setResult({ ...d, email: form.email })
      setForm({ name: '', email: '', phone: '', cooperativeId: coopId })
      await list.reload({ silent: true })
    } catch (err) { setError(err) } finally { setBusy(null) }
  }

  const act = async (id, key, fn, email) => {
    setBusy(`${key}-${id}`); setError(null); setResult(null)
    try {
      const d = await fn()
      if (d?.emailSent !== undefined) setResult({ ...d, email })
      await list.reload({ silent: true })
    } catch (err) { setError(err) } finally { setBusy(null) }
  }

  const admins = list.data?.admins ?? []
  const stateOf = (a) => (a.status === 'suspended' ? 'Suspended' : a.invitePending ? 'Invited, not joined' : 'Active')

  return (
    <>
      <PlatformHeading title="Cooperative admins."><p className="mt-6 max-w-[600px] text-[15px] leading-[1.7] text-muted">Check that a person is genuine, then invite them. They get an email with a link to set their own password (valid for 2 days).</p></PlatformHeading>

      <form onSubmit={invite} noValidate className="glass mt-12 rounded-3xl p-6 sm:p-8">
        <p className="eyebrow text-[10.5px]">Invite a cooperative admin</p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">Full name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Their name" className={fieldClass} required />
            {fieldError('name') && <span role="alert" className="mt-1 block text-[12px] font-normal normal-case tracking-normal text-rust">{fieldError('name')}</span>}
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" className={fieldClass} required />
            {fieldError('email') && <span role="alert" className="mt-1 block text-[12px] font-normal normal-case tracking-normal text-rust">{fieldError('email')}</span>}
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">Mobile (optional)
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit number" className={fieldClass} />
            {fieldError('phone') && <span role="alert" className="mt-1 block text-[12px] font-normal normal-case tracking-normal text-rust">{fieldError('phone')}</span>}
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">Cooperative
            <select value={coopId} onChange={(e) => setForm({ ...form, cooperativeId: e.target.value })} className={`${fieldClass} appearance-none`}>
              {cooperatives.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        {error && !error.details?.length && <p role="alert" className="mt-5 rounded-xl bg-rust/10 px-4 py-3 text-[13px] text-rust">{error.message}</p>}
        <div className="mt-6"><Button type="submit" disabled={busy === 'invite' || !coopId}>{busy === 'invite' ? 'Sending…' : 'Send invitation'}</Button></div>
        <AnimatePresence>{result && <Result result={result} onClose={() => setResult(null)} />}</AnimatePresence>
      </form>

      <div className="mt-12">{list.loading && <Spinner label="Loading" />}{list.error && <ErrorNote error={list.error} onRetry={list.reload} />}</div>
      {admins.length > 0 && (
        <ul className="border-t border-line">
          {admins.map((a, i) => (
            <motion.li key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: i * 0.05 }} className="border-b border-line py-6">
              <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-center">
                <div>
                  <p className="font-serif text-[22px] leading-tight">{a.name}</p>
                  <p className="mt-1 text-[12.5px] text-muted">{a.email}{a.phone ? ` · ${a.phone}` : ''}</p>
                </div>
                <p className="text-[13px]">{a.cooperativeName}</p>
                <p className="flex items-center gap-2 text-[13px]"><span aria-hidden="true" className={`size-1.5 rounded-full ${a.invitePending ? 'bg-faint' : a.status === 'suspended' ? 'bg-rust' : 'bg-ink'}`} />{stateOf(a)}
                  <span className="ml-2 text-[11.5px] text-muted">{a.lastLoginAt ? `last in ${fmtDateTime(a.lastLoginAt)}` : ''}</span></p>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-medium">
                  {a.invitePending ? (
                    <button type="button" disabled={busy === `resend-${a.id}`} onClick={() => act(a.id, 'resend', () => api.admin.coopAdmins.resendInvite(a.id), a.email)} className="border-b border-ink pb-0.5 hover:border-rust hover:text-rust">Resend invitation</button>
                  ) : (
                    <button type="button" disabled={busy === `reset-${a.id}`} onClick={() => act(a.id, 'reset', () => api.admin.coopAdmins.resetPassword(a.id), a.email)} className="border-b border-ink pb-0.5 hover:border-rust hover:text-rust">Send password link</button>
                  )}
                  <button type="button" disabled={busy === `status-${a.id}`} onClick={() => act(a.id, 'status', () => api.admin.setUserStatus(a.id, a.status === 'suspended' ? 'active' : 'suspended'))} className="border-b border-ink/40 pb-0.5 text-muted hover:border-rust hover:text-rust">{a.status === 'suspended' ? 'Re-activate' : 'Suspend'}</button>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
      {!list.loading && admins.length === 0 && !list.error && <p className="border-y border-line py-10 text-[14px] text-muted">No cooperative admins yet. Invite the first one above.</p>}
    </>
  )
}
