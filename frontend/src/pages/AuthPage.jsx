import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Logo from '../components/ui/Logo'
import PasswordRules from '../components/ui/PasswordRules'
import { hasSignedInBefore, useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import { AREAS, DOORS, ROLE_LABEL, roleHome } from '../lib/constants'

const ease = [0.22, 1, 0.36, 1]
const fieldClass =
  'mt-1 w-full border-b border-ink/25 bg-transparent py-3 text-[15px] font-normal outline-none transition-colors placeholder:text-faint focus:border-rust'

function Field({ label, error, children }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
      {label}
      {children}
      {error && <span role="alert" className="mt-1.5 block text-[12px] font-normal normal-case tracking-normal text-rust">{error}</span>}
    </label>
  )
}

// A row of tick-able pills (skills, areas)
function Pills({ label, options, value, onChange, error, hint }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  return (
    <fieldset>
      <legend className="text-[11px] font-semibold uppercase tracking-[0.12em]">{label}</legend>
      {hint && <p className="mt-1 text-[12px] font-normal normal-case tracking-normal text-muted">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o.id)
          return (
            <button key={o.id} type="button" role="checkbox" aria-checked={on} onClick={() => toggle(o.id)} className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${on ? 'border-ink bg-ink text-white' : 'border-ink/25 hover:border-ink'}`}>
              {o.name}
            </button>
          )
        })}
        {options.length === 0 && <span className="text-[12px] text-muted">Loading…</span>}
      </div>
      {error && <p role="alert" className="mt-1.5 text-[12px] text-rust">{error}</p>}
    </fieldset>
  )
}

export default function AuthPage({ door: doorProp }) {
  const [params] = useSearchParams()
  const queryDoor = params.get('role')
  // The platform door only exists on its own page (/platform/login)
  const doorId = doorProp ?? (DOORS[queryDoor] && queryDoor !== 'platform' ? queryDoor : 'customer')
  const door = DOORS[doorId]
  const { status, user, login, register, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // First time on this browser -> "Create account". Returning -> "Log in". Either is one click away.
  const [mode, setMode] = useState(door.canRegister && !hasSignedInBefore() ? 'register' : 'login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', cooperativeId: '', shramikCardNumber: '', serviceIds: [], areas: [] })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [coops, setCoops] = useState([])
  const [skills, setSkills] = useState([])

  const isRegister = mode === 'register'
  const isWorkerSignup = isRegister && doorId === 'worker'

  // Worker sign-up needs the cooperatives, and the skills of the chosen one
  useEffect(() => {
    if (!isWorkerSignup) return
    api.cooperatives.list().then((d) => {
      setCoops(d.cooperatives)
      if (d.cooperatives.length === 1) setForm((f) => ({ ...f, cooperativeId: d.cooperatives[0].id }))
    }).catch(() => {})
  }, [isWorkerSignup])
  useEffect(() => {
    if (!isWorkerSignup || !form.cooperativeId) return setSkills([])
    api.cooperatives.services(form.cooperativeId).then((d) => setSkills(d.services)).catch(() => {})
  }, [isWorkerSignup, form.cooperativeId])

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(null) }
  const setList = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setError(null) }
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
      if (!isRegister) await login(form.email, form.password, doorId)
      else if (doorId === 'worker') {
        await register({
          role: 'worker',
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          cooperativeId: form.cooperativeId,
          shramikCardNumber: form.shramikCardNumber,
          serviceIds: form.serviceIds,
          areas: form.areas,
        })
      } else {
        await register({ role: 'customer', name: form.name, email: form.email, password: form.password, ...(form.phone ? { phone: form.phone } : {}) })
      }
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const title = doorId === 'platform' ? 'Platform sign-in.' : isRegister ? 'Create your account.' : 'Welcome back.'

  return (
    <Shell title={title} door={door.label} wide={isWorkerSignup}>
      {door.canRegister && (
        <div role="tablist" aria-label="Sign in or create account" className="mt-7 grid grid-cols-2 rounded-xl bg-ink/[0.06] p-1 text-[13px] font-medium">
          {[['register', 'Create account'], ['login', 'Log in']].map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => { setMode(id); setError(null) }} className={`relative rounded-lg py-2 transition-colors ${mode === id ? 'text-ink' : 'text-muted hover:text-ink'}`}>
              {mode === id && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-lg bg-white shadow-sm" transition={{ duration: 0.3, ease }} />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      )}
      {doorId === 'owner' && (
        <p className="mt-4 text-[13px] leading-relaxed text-muted">
          Cooperative owners are invited by the KaamGar platform team. Use the link in your invitation email to set your password, then sign in here.
        </p>
      )}
      {doorId === 'platform' && (
        <p className="mt-4 text-[13px] leading-relaxed text-muted">This sign-in is only for the KaamGar platform administrator.</p>
      )}

      <form onSubmit={submit} noValidate className="mt-7 space-y-6 text-left">
        {isRegister && (
          <Field label="Full name" error={fieldError('name')}>
            <input autoComplete="name" value={form.name} onChange={set('name')} placeholder="Your name" className={fieldClass} required />
          </Field>
        )}

        <Field label="Email" error={fieldError('email')}>
          <input type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" className={fieldClass} required />
        </Field>

        {isRegister && (
          <Field label={isWorkerSignup ? 'Mobile number' : 'Mobile number (optional)'} error={fieldError('phone')}>
            <input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="10-digit number" className={fieldClass} required={isWorkerSignup} />
          </Field>
        )}

        <Field label="Password" error={fieldError('password')}>
          <input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} placeholder={isRegister ? 'Choose a strong password' : 'Your password'} className={fieldClass} required />
        </Field>

        {isRegister && <PasswordRules value={form.password} />}
        {!isRegister && (
          <p className="-mt-2 text-right text-[12.5px]">
            <Link to="/forgot-password" className="text-muted underline-offset-2 hover:text-rust hover:underline">Forgot password?</Link>
          </p>
        )}

        {isWorkerSignup && (
          <>
            <div className="space-y-6 rounded-2xl bg-white/45 p-5">
              <p className="text-[12.5px] leading-relaxed text-muted">
                Your cooperative checks these details before approving you, so please enter them exactly as on your card.
              </p>
              <Field label="Shramik card number" error={fieldError('shramikCardNumber')}>
                <input value={form.shramikCardNumber} onChange={set('shramikCardNumber')} placeholder="As written on your card" className={fieldClass} required />
              </Field>

              {coops.length > 1 ? (
                <Field label="Your cooperative" error={fieldError('cooperativeId')}>
                  <select value={form.cooperativeId} onChange={set('cooperativeId')} className={`${fieldClass} appearance-none`} required>
                    <option value="" disabled>Choose your cooperative</option>
                    {coops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
              ) : (
                coops[0] && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">Your cooperative</p>
                    <p className="mt-1 text-[14px]">{coops[0].name}</p>
                    <p className="mt-0.5 text-[12px] text-muted">Its owner will review your account.</p>
                  </div>
                )
              )}

              <Pills label="Your skills" hint="Choose all the work you can do." options={skills} value={form.serviceIds} onChange={setList('serviceIds')} error={fieldError('serviceIds')} />
              <Pills label="Areas you can go to" options={AREAS.map((a) => ({ id: a, name: a }))} value={form.areas} onChange={setList('areas')} error={fieldError('areas')} />
            </div>
            <p className="text-[12.5px] leading-relaxed text-muted">
              You can sign in right away, but you can take jobs only after your cooperative owner approves you.
            </p>
          </>
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
        {doorId === 'platform' ? (
          <Link to="/" className="border-b border-ink/40 pb-0.5 hover:border-rust hover:text-rust">← Back to KaamGar</Link>
        ) : (
          <Link to="/" state={{ openChooser: true }} className="border-b border-ink/40 pb-0.5 hover:border-rust hover:text-rust">← Choose a different role</Link>
        )}
      </p>
    </Shell>
  )
}

export function Shell({ title, door, wide, children }) {
  return (
    <div className="landing-backdrop grid min-h-screen place-items-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className={`glass w-full rounded-[28px] px-7 py-10 text-center sm:px-10 ${wide ? 'max-w-[540px]' : 'max-w-[460px]'}`}
      >
        <Logo className="justify-center" />
        {door && <p className="eyebrow mt-8 text-[10.5px]">{door}</p>}
        <h1 className="mt-3 font-serif text-[36px] font-normal leading-[1.05] tracking-[-0.03em]">{title}</h1>
        {children}
      </motion.div>
    </div>
  )
}
