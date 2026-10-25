import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../../components/ui/Logo'
import AccountMenu from '../../components/ui/AccountMenu'
import { useCooperativeName } from '../../hooks/useCooperative'

const tabs = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/bookings', label: 'Bookings', end: false },
  { to: '/admin/workers', label: 'Workers', end: false },
  { to: '/admin/services', label: 'Services', end: false },
  { to: '/admin/review', label: 'Review', end: false },
]

// Shell for the Cooperative Admin space: top bar, tabs, animated page entrance.
export default function AdminLayout() {
  const { pathname } = useLocation()
  const coopName = useCooperativeName()

  return (
    <div className="min-h-screen bg-page text-ink">
      <header>
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 sm:px-[60px]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Logo mark={false} />
            <span className="eyebrow text-[10px]">Cooperative admin</span>
            <span aria-hidden="true" className="hidden h-4 w-px bg-line sm:block" />
            <span className="hidden text-[12px] text-muted sm:block">{coopName}</span>
          </div>
          <AccountMenu />
        </div>

        <div className="border-y border-line/80">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 sm:px-[60px]">
            <nav className="flex gap-6 overflow-x-auto overflow-y-hidden [scrollbar-width:none] sm:gap-7 [&::-webkit-scrollbar]:hidden" aria-label="Cooperative admin">
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `relative whitespace-nowrap py-4 text-[13px] transition-colors ${
                      isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {t.label}
                      {isActive && (
                        <motion.span layoutId="admin-tab" className="absolute inset-x-0 bottom-0 h-px bg-ink" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <span className="eyebrow hidden text-[10px] sm:block">Bhopal pilot</span>
          </div>
        </div>
      </header>

      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-[1240px] px-5 pb-32 pt-14 sm:px-[60px] sm:pt-[72px]"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
