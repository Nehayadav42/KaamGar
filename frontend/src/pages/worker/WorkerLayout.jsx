import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import HeaderActions from '../../components/ui/HeaderActions'
import Logo from '../../components/ui/Logo'
import ErrorNote from '../../components/ui/ErrorNote'
import Spinner from '../../components/ui/Spinner'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { api } from '../../lib/api'

const ease = [0.22, 1, 0.36, 1]

function Details({ w }) {
  const rows = [['Mobile', w.phone], ['Shramik card', w.shramikCardNumber], ['Skills', w.skills.join(', ') || '—'], ['Areas', w.areas.join(', ') || '—'], ['Email', w.email]]
  return (
    <dl className="mt-6 text-left text-[13px]">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[110px_1fr] gap-3 border-b border-line py-2.5 first:border-t"><dt className="text-muted">{k}</dt><dd className="break-words">{v}</dd></div>
      ))}
    </dl>
  )
}

// Wraps the worker area. Until the cooperative owner approves the worker, only the waiting screen shows.
export default function WorkerLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { data, error, loading, reload } = useAsync(() => api.worker.profile(), [])
  const approved = user.status === 'active'

  return (
    <div className="landing-backdrop min-h-screen">
      <header className="border-b border-ink/10">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 sm:px-[60px]">
          <div className="flex items-baseline gap-3"><Logo mark={false} /><span className="eyebrow text-[10px]">Worker</span></div>
          <HeaderActions />
        </div>
        {approved && (
          <div className="mx-auto flex max-w-[1240px] gap-7 px-5 sm:px-[60px]">
            {[['/worker', 'My jobs', true], ['/worker/profile', 'My details', false]].map(([to, label, end]) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `relative py-4 text-[13px] ${isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink'}`}>
                {({ isActive }) => (<>{label}{isActive && <motion.span layoutId="worker-tab" className="absolute inset-x-0 bottom-0 h-px bg-ink" />}</>)}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {approved ? (
        <motion.main key={pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} className="mx-auto max-w-[900px] px-5 pb-32 pt-12 sm:px-8">
          <Outlet context={{ profile: data?.worker }} />
        </motion.main>
      ) : (
        <div className="grid place-items-center px-4 pb-24 pt-14">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }} className="glass w-full max-w-[560px] rounded-[28px] p-8 text-center sm:p-10">
            <p className="eyebrow">Waiting for approval</p>
            <h1 className="mt-3 font-serif text-[36px] leading-[1.05] tracking-[-0.03em]">Your cooperative owner will review your details.</h1>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">You’ll get a notification when you’re approved. After that you can accept jobs.</p>
            {loading && <div className="mt-6 flex justify-center"><Spinner label="Loading your details" /></div>}
            {error && <div className="mt-6"><ErrorNote error={error} onRetry={reload} /></div>}
            {data && <Details w={data.worker} />}
          </motion.div>
        </div>
      )}
    </div>
  )
}
