import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import { api } from '../lib/api'
import { Shell } from './AuthPage'

const fieldClass =
  'mt-1 w-full border-b border-ink/25 bg-transparent py-3 text-[15px] font-normal outline-none transition-colors placeholder:text-faint focus:border-rust'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.auth.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <Shell title="Check your email.">
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          If an account exists for <strong className="font-medium text-ink">{email}</strong>, we’ve sent a link to choose a new password. It works for a short time, and only once.
        </p>
        <p className="mt-8 text-[12.5px] text-muted"><Link to="/" className="border-b border-ink/40 pb-0.5 hover:border-rust hover:text-rust">← Back to KaamGar</Link></p>
      </Shell>
    )
  }

  return (
    <Shell title="Forgot your password?">
      <p className="mt-3 text-[14px] leading-relaxed text-muted">Enter your email and we’ll send you a link to choose a new one.</p>
      <form onSubmit={submit} noValidate className="mt-8 space-y-6 text-left">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
          Email
          <input type="email" autoComplete="email" autoFocus value={email} onChange={(e) => { setEmail(e.target.value); setError(null) }} placeholder="you@example.com" className={fieldClass} required />
        </label>
        {error && <p role="alert" className="rounded-xl bg-rust/10 px-4 py-3 text-[13px] text-rust">{error.details?.[0]?.message ?? error.message}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy || !email}>{busy ? 'One moment…' : 'Send me a link'}</Button>
      </form>
      <p className="mt-8 text-center text-[12.5px] text-muted"><Link to="/" className="border-b border-ink/40 pb-0.5 hover:border-rust hover:text-rust">← Back to KaamGar</Link></p>
    </Shell>
  )
}
