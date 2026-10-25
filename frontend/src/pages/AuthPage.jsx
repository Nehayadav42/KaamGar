import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Logo from '../components/ui/Logo'
import { hasSignedInBefore, useAuth } from '../context/AuthContext'
import { DOORS, ROLE_LABEL, roleHome } from '../lib/constants'

const ease = [0.22, 1, 0.36, 1]
const fieldClass =
  'mt-1 w-full border-b border-ink/25 bg-transparent py-3 text-[15px] font-normal outline-none transition-colors placeholder:text-faint focus:border-rust'

const rules = [
  ['At least 10 characters', (p) => p.length >= 10],
  ['A letter', (p) => /[A-Za-z]/.test(p)],
  ['A number', (p) => /\d/.test(p)],
]

function Field({ label, error, children }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
      {label}
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-[12px] font-normal normal-case tracking-normal text-rust">
          {error}
        </span>
      )}
    </label>
  )
}

export default function AuthPage() {
  const [params] = useSearchParams()
  const doorId = DOORS[params.get('role')] ? params.get('role') : 'customer'
  const door = DOORS[doorId]
  const { status, user, login, register, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // First time on this browser -> "Create account". Returning -> "Log in". Either is one click away.
  const [mode, setMode] = useState(door.canRegister && !hasSignedInBefore() ? 'register' : 'login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setError(null)
  }
  const fieldError = (name) => error?.details?.find((d) => d.field === name)?.message

  // Already signed in: go to the right place, or explain the mismatch
  if (status === 'authenticated') {
    if (door.roles.includes(user.role)) {
      const from = location.state?.from?.pathname
      const home = roleHome(user.role)
      return <Navigate to={from && from.startsWith(home) ? from : home} replace />
    }
    return (
      <Shell title="You’re already signed in.">
        <p className="mt-3 text-[14px] text-muted">
          This account is registered as <strong className="font-medium text-ink">{ROLE_LABEL[user.role]}</strong>, not {door.label}.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <Button onClick={() => navigate(roleHome(user.role), { replace: true })}>Continue as {ROLE_LABEL[user.role]}</Button>
          <button type="button" onClick={logout} className="border-b border-ink pb-0.5 text-[13px] font-medium hover:border-rust hover:text-rust">
            Log out and use a different account
          </button>
        </div>
      </Shell>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') await login(form.email, form.password)
      else {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          role: doorId === 'worker' ? 'worker' : 'customer',
          ...(form.phone ? { phone: form.phone } : {}),
        })
      }
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const isRegister = mode === 'register'

  return (
    <Shell title={isRegister ? 'Create your account.' : 'Welcome back.'} door={door.label}>
      {door.canRegister && (
        <div role="tablist" aria-label="Sign in or create account" className="mt-7 grid grid-cols-2 rounded-xl bg-ink/[0.06] p-1 text-[13px] font-medium">
          {[
            ['register', 'Create account'],
            ['login', 'Log in'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => { setMode(id); setError(null) }}
              className={`relative rounded-lg py-2 transition-colors ${mode === id ? 'text-ink' : 'text-muted hover:text-ink'}`}
            >
              {mode === id && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ duration: 0.3, ease }} />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      )}
      {!door.canRegister && (
        <p className="mt-4 text-[13px] text-muted">
          Cooperative accounts are created by the KaamGar platform team. Use the email and password you were given.
        </p>
      )}

      <form onSubmit={submit} noValidate className="mt-7 space-y-6 text-left">
        <AnimatePresence initial={false}>
          {isRegister && (
            <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6 overflow-hidden">
              <Field label="Full name" error={fieldError('name')}>
                <input autoComplete="name" value={form.name} onChange={set('name')} placeholder="Your name" className={fieldClass} required />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Email" error={fieldError('email')}>
          <input type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={fieldClass} required />
        </Field>

        <AnimatePresence initial={false}>
          {isRegister && (
            <motion.div key="phone" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <Field label="Mobile number (optional)" error={fieldError('phone')}>
                <input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="10-digit number" className={fieldClass} />
              </Field>
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Password" error={fieldError('password')}>
          <input
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={set('password')}
            placeholder={isRegister ? 'Choose a strong password' : 'Your password'}
            className={fieldClass}
            required
          />
        </Field>

        {isRegister && (
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[12px]" aria-label="Password rules">
            {rules.map(([label, test]) => {
              const ok = test(form.password)
              return (
                <li key={label} className={`flex items-center gap-1.5 transition-colors ${ok ? 'text-ink' : 'text-faint'}`}>
                  <Check size={12} className={ok ? 'text-rust' : 'opacity-40'} /> {label}
                </li>
              )
            })}
          </ul>
        )}

        {isRegister && doorId === 'worker' && (
          <p className="rounded-xl bg-white/50 px-4 py-3 text-[12.5px] leading-relaxed text-muted">
            A cooperative admin approves worker accounts. You can sign in right away, but you can take jobs only after approval.
          </p>
        )}

        <AnimatePresence>
          {error && !error.details?.length && (
            <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-rust/10 px-4 py-3 text-[13px] text-rust">
              {error.message}
            </motion.p>
          )}
        </AnimatePresence>

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'One moment…' : isRegister ? 'Create account' : 'Log in'}
        </Button>
      </form>

      <p className="mt-8 text-center text-[12.5px] text-muted">
        <Link to="/" state={{ openChooser: true }} className="border-b border-ink/40 pb-0.5 hover:border-rust hover:text-rust">
          ← Choose a different role
        </Link>
      </p>
    </Shell>
  )
}

function Shell({ title, door, children }) {
  return (
    <div className="landing-backdrop grid min-h-screen place-items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="glass w-full max-w-[460px] rounded-[28px] px-7 py-10 text-center sm:px-10"
      >
        <Logo className="justify-center" />
        {door && <p className="eyebrow mt-8 text-[10.5px]">{door}</p>}
        <h1 className="mt-3 font-serif text-[36px] font-normal leading-[1.05] tracking-[-0.03em]">{title}</h1>
        {children}
      </motion.div>
    </div>
  )
}
