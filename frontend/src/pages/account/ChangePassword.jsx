import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Logo from '../../components/ui/Logo'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { roleHome } from '../../lib/constants'

const fieldClass =
  'mt-1 w-full border-b border-ink/25 bg-transparent py-3 text-[15px] font-normal outline-none transition-colors placeholder:text-faint focus:border-rust'

export default function ChangePassword() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const forced = user.mustChangePassword

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { accessToken } = await api.auth.changePassword(form)
      const fresh = await refreshUser(accessToken)
      navigate(roleHome(fresh.role), { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }
  const fieldError = (name) => error?.details?.find((d) => d.field === name)?.message

  return (
    <div className="landing-backdrop grid min-h-screen place-items-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="glass w-full max-w-[460px] rounded-[28px] px-7 py-10 sm:px-10">
        <Logo className="justify-center" />
        <h1 className="mt-8 text-center font-serif text-[34px] leading-[1.05] tracking-[-0.03em]">
          {forced ? 'Choose a new password.' : 'Change your password.'}
        </h1>
        {forced && (
          <p className="mt-3 text-center text-[13.5px] text-muted">
            Your first password was set for you. Replace it with one only you know before you continue.
          </p>
        )}
        <form onSubmit={submit} noValidate className="mt-8 space-y-6">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
            Current password
            <input type="password" autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className={fieldClass} required />
          </label>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
            New password
            <input type="password" autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} placeholder="10+ characters, a letter and a number" className={fieldClass} required />
            {fieldError('newPassword') && <span role="alert" className="mt-1.5 block text-[12px] font-normal normal-case tracking-normal text-rust">{fieldError('newPassword')}</span>}
          </label>
          {error && !error.details?.length && <p role="alert" className="rounded-xl bg-rust/10 px-4 py-3 text-[13px] text-rust">{error.message}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'One moment…' : 'Save new password'}</Button>
        </form>
        <p className="mt-6 text-center text-[12.5px] text-muted">
          Changing it signs you out of other devices.{' '}
          {!forced && (
            <button type="button" onClick={() => navigate(-1)} className="ml-1 border-b border-ink/40 pb-0.5 hover:border-rust hover:text-rust">Cancel</button>
          )}
          {forced && (
            <button type="button" onClick={async () => { await logout(); navigate('/', { replace: true }) }} className="ml-1 border-b border-ink/40 pb-0.5 hover:border-rust hover:text-rust">Log out instead</button>
          )}
        </p>
      </motion.div>
    </div>
  )
}
