import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import PasswordRules from '../components/ui/PasswordRules'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { roleHome } from '../lib/constants'
import { Shell } from './AuthPage'

const fieldClass =
  'mt-1 w-full border-b border-ink/25 bg-transparent py-3 text-[15px] font-normal outline-none transition-colors placeholder:text-faint focus:border-rust'

// Opened from the link in an email: "Set your password" (invitation) or "Choose a new password" (reset)
export default function SetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { acceptSession } = useAuth()
  const navigate = useNavigate()
  const [info, setInfo] = useState({ state: 'checking' }) // checking | ready | invalid
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return setInfo({ state: 'invalid' })
    api.auth.checkSetupToken(token).then((d) => setInfo({ state: 'ready', ...d })).catch(() => setInfo({ state: 'invalid' }))
  }, [token])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const data = await api.auth.setPassword(token, password)
      const user = acceptSession(data)
      navigate(roleHome(user.role), { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  if (info.state === 'checking') {
    return <Shell title="One moment…"><div className="mt-8 flex justify-center"><Spinner label="Checking your link" /></div></Shell>
  }

  if (info.state === 'invalid') {
    return (
      <Shell title="This link has expired.">
        <p className="mt-3 text-[14px] leading-relaxed text-muted">The link was already used, or it is more than a short while old. Links work only once.</p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <Button onClick={() => navigate('/forgot-password')}>Get a new link</Button>
          <Link to="/" className="border-b border-ink/40 pb-0.5 text-[12.5px] text-muted hover:border-rust hover:text-rust">← Back to KaamGar</Link>
        </div>
      </Shell>
    )
  }

  const invite = info.purpose === 'invite'
  const fieldError = (name) => error?.details?.find((d) => d.field === name)?.message

  return (
    <Shell title={invite ? `Welcome, ${info.name.split(' ')[0]}.` : 'Choose a new password.'}>
      <p className="mt-3 text-[14px] leading-relaxed text-muted">
        {invite ? 'You’ve been invited as a cooperative owner. Set a password to finish.' : `For ${info.email}.`}
      </p>
      <form onSubmit={submit} noValidate className="mt-8 space-y-6 text-left">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
          {invite ? 'Your email' : 'Account'}
          <input value={info.email} readOnly className={`${fieldClass} text-muted`} />
        </label>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
          New password
          <input type="password" autoComplete="new-password" autoFocus value={password} onChange={(e) => { setPassword(e.target.value); setError(null) }} placeholder="Choose a strong password" className={fieldClass} required />
          {fieldError('password') && <span role="alert" className="mt-1.5 block text-[12px] font-normal normal-case tracking-normal text-rust">{fieldError('password')}</span>}
        </label>
        <PasswordRules value={password} />
        {error && !error.details?.length && <p role="alert" className="rounded-xl bg-rust/10 px-4 py-3 text-[13px] text-rust">{error.message}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'One moment…' : invite ? 'Set password and continue' : 'Save new password'}</Button>
      </form>
    </Shell>
  )
}
