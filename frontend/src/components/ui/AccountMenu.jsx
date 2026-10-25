import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABEL } from '../../lib/constants'

// "▶ Account" in the top bar: who you are, change password, switch role, log out.
export default function AccountMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const item = 'block w-full rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-white/60'

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 border-b border-transparent pb-0.5 text-[12.5px] font-medium hover:border-ink"
      >
        <span aria-hidden="true" className={`text-[8px] transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        Account
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="glass absolute right-0 top-full z-40 mt-3 w-64 rounded-2xl p-2"
          >
            <div className="px-3 pb-3 pt-2">
              <p className="truncate text-[13.5px] font-medium">{user?.name}</p>
              <p className="truncate text-[12px] text-muted">{user?.email}</p>
              <p className="eyebrow mt-2 text-[10px]">{ROLE_LABEL[user?.role]}</p>
            </div>
            <div className="border-t border-ink/10 pt-1">
              <button role="menuitem" type="button" className={item} onClick={() => navigate('/account/password')}>
                Change password
              </button>
              <button role="menuitem" type="button" className={item} onClick={() => navigate('/', { state: { openChooser: true } })}>
                Switch role
              </button>
              <button
                role="menuitem"
                type="button"
                className={`${item} text-rust`}
                onClick={async () => {
                  await logout()
                  navigate('/', { replace: true })
                }}
              >
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
