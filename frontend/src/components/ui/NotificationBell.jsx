import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { fmtRelative } from '../../lib/format'

const POLL_MS = 30_000

// The bell: shows how many notifications are unread, and lists the latest ones.
// It checks for new ones every 30 seconds and whenever the tab becomes active again.
export default function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState({ notifications: [], unreadCount: 0 })
  const box = useRef(null)

  const load = useCallback(async () => {
    try {
      setState(await api.notifications.list({ limit: 15 }))
    } catch {
      /* the bell is never allowed to break the page */
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_MS)
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  useEffect(() => {
    if (!open) return
    load()
    const onDown = (e) => box.current && !box.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, load])

  const openItem = async (n) => {
    setOpen(false)
    if (!n.read) {
      setState((s) => ({ ...s, unreadCount: Math.max(0, s.unreadCount - 1), notifications: s.notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x)) }))
      api.notifications.read(n.id).catch(() => {})
    }
    if (n.link) navigate(n.link)
  }

  const readAll = async () => {
    setState((s) => ({ unreadCount: 0, notifications: s.notifications.map((x) => ({ ...x, read: true })) }))
    api.notifications.readAll().catch(() => {})
  }

  const { notifications, unreadCount } = state

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-9 place-items-center rounded-full transition-colors hover:bg-ink/[0.06]"
      >
        <Bell size={17} strokeWidth={1.8} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-rust px-1 text-[10px] font-semibold leading-[18px] text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="glass absolute right-0 top-full z-40 mt-3 w-[min(360px,calc(100vw-2rem))] rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
              <p className="text-[13px] font-medium">Notifications</p>
              {unreadCount > 0 && (
                <button type="button" onClick={readAll} className="text-[12px] text-muted underline-offset-2 hover:text-rust hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
            <ul className="max-h-[380px] overflow-y-auto">
              {notifications.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-muted">Nothing yet. Updates about your work will appear here.</li>}
              {notifications.map((n) => (
                <li key={n.id} className="border-b border-ink/5 last:border-0">
                  <button type="button" onClick={() => openItem(n)} className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-white/60">
                    <span aria-hidden="true" className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-rust'}`} />
                    <span className="min-w-0">
                      <span className={`block text-[13px] ${n.read ? 'text-ink/80' : 'font-medium'}`}>{n.title}</span>
                      {n.body && <span className="mt-0.5 block text-[12px] leading-snug text-muted">{n.body}</span>}
                      <span className="mt-1 block text-[11px] text-faint">{fmtRelative(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
