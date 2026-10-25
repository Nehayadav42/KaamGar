import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../../components/ui/Logo'
import AccountMenu from '../../components/ui/AccountMenu'

const tabs = [
  { to: '/customer', label: 'Services', end: true },
  { to: '/customer/bookings', label: 'My bookings', end: false },
]

export default function CustomerLayout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-page text-ink">
      <header>
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 sm:px-[60px]">
          <div className="flex items-baseline gap-3">
            <Logo mark={false} />
            <span className="eyebrow text-[10px]">Customer</span>
          </div>
          <AccountMenu />
        </div>
        <div className="border-y border-line/80">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 sm:px-[60px]">
            <nav className="flex gap-7" aria-label="Customer">
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `relative py-4 text-[13px] transition-colors ${isActive ? 'font-medium text-ink' : 'text-muted hover:text-ink'}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {t.label}
                      {isActive && <motion.span layoutId="customer-tab" className="absolute inset-x-0 bottom-0 h-px bg-ink" />}
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
        <div className="mx-auto max-w-[912px]">
          <Outlet />
        </div>
      </motion.main>
    </div>
  )
}
