import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import HeaderActions from '../../components/ui/HeaderActions'
import Logo from '../../components/ui/Logo'

const tabs = [
  { to: '/platform', label: 'Overview', end: true },
  { to: '/platform/admins', label: 'Cooperative admins', end: false },
  { to: '/platform/cooperatives', label: 'Cooperatives', end: false },
  { to: '/platform/audit', label: 'Audit log', end: false },
]

// The platform administrator's own space. It looks different from the cooperative owner's on purpose.
export default function PlatformLayout() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen bg-page text-ink">
      <header>
        <div className="bg-ink text-white">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 sm:px-[60px]">
            <div className="flex items-baseline gap-3">
              <Logo mark={false} className="[&_span]:text-white" />
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/60">Platform admin</span>
            </div>
            <div className="[&_button]:text-white [&_button:hover]:bg-white/10 [&_svg]:text-white"><HeaderActions /></div>
          </div>
        </div>
        <div className="border-b border-line/80">
          <div className="mx-auto flex max-w-[1240px] items-center gap-7 overflow-x-auto overflow-y-hidden px-5 [scrollbar-width:none] sm:px-[60px] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `relative whitespace-nowrap py-4 text-[13px] transition-colors ${isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink'}`}>
                {({ isActive }) => (<>{t.label}{isActive && <motion.span layoutId="platform-tab" className="absolute inset-x-0 bottom-0 h-px bg-ink" />}</>)}
              </NavLink>
            ))}
          </div>
        </div>
      </header>
      <motion.main key={pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="mx-auto max-w-[1240px] px-5 pb-32 pt-14 sm:px-[60px] sm:pt-[72px]">
        <Outlet />
      </motion.main>
    </div>
  )
}
