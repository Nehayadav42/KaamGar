import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { roles } from '../data/content'

const ease = [0.22, 1, 0.36, 1]

// Where each role sits relative to the circle's centre (px): Customer left, Worker top, Owner right.
const spots = {
  customer: { x: -333, y: -24 },
  worker: { x: 0, y: -115 },
  owner: { x: 333, y: -34 },
}

export default function RoleOverlay({ open, onClose }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(null)
  const closeRef = useRef(null)

  // Lock page scroll, close on Escape, focus "Close".
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      setHovered(null)
    }
  }, [open, onClose])

  const choose = (role) => {
    onClose()
    navigate(role.to)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Choose your role"
          className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(241,237,229,0.88)] backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease }}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="absolute right-[4vw] top-9 border-b border-ink pb-0.5 text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
          >
            Close
          </button>

          <div className="mx-auto flex min-h-full max-w-[1200px] flex-col items-center px-6 pb-16 pt-[72px] text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.1 }}
              className="eyebrow"
            >
              Your place in local work
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.18 }}
              className="mt-5 font-serif text-[44px] font-normal leading-none tracking-[-0.03em] sm:text-[60px] md:text-[76px]"
            >
              Choose your role.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-5 text-[14px] text-muted"
            >
              One community. Three ways to take part.
            </motion.p>

            {/* Small screens: stacked list */}
            <ul className="mt-14 w-full max-w-sm space-y-10 md:hidden">
              {roles.map((role) => (
                <li key={role.id}>
                  <button type="button" onClick={() => choose(role)} className="group w-full">
                    <span className="block font-serif text-[34px] leading-tight transition-colors group-hover:text-rust">
                      {role.name}
                    </span>
                    <span className="mt-1 block text-[13px] text-muted">{role.desc}</span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop: three roles around a circle */}
            <div className="relative mt-4 hidden h-[460px] w-full md:block">
              <motion.div
                aria-hidden="true"
                className="absolute left-1/2 top-[130px] size-[383px] -translate-x-1/2 rounded-full border border-ink/15"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease, delay: 0.2 }}
              />
              <div className="absolute left-1/2 top-[321px] h-0 w-0">
                {roles.map((role, i) => {
                  const spot = spots[role.id]
                  const active = hovered === role.id
                  const dimmed = hovered !== null && !active
                  return (
                    <motion.div
                      key={role.id}
                      className="absolute w-[280px]"
                      style={{ left: spot.x, top: spot.y - 22, x: '-50%' }}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: dimmed ? 0.4 : 1, y: active ? -4 : 0 }}
                      transition={{
                        opacity: { duration: 0.3, delay: hovered === null ? 0.5 + i * 0.12 : 0 },
                        y: { duration: 0.4, ease, delay: hovered === null && !active ? 0.5 + i * 0.12 : 0 },
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => choose(role)}
                        onMouseEnter={() => setHovered(role.id)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(role.id)}
                        onBlur={() => setHovered(null)}
                        className="block w-full text-center focus-visible:outline-none"
                      >
                        <span
                          className={`block font-serif text-[42px] leading-[1.25] tracking-[-0.01em] transition-colors duration-300 ${
                            active ? 'text-ink' : 'text-ink/85'
                          }`}
                        >
                          {role.name}
                        </span>
                        <motion.span
                          aria-hidden="true"
                          className="mx-auto mt-2 block h-px w-full origin-center bg-rust"
                          animate={{ scaleX: active ? 1 : 0 }}
                          transition={{ duration: 0.4, ease }}
                        />
                        <span className="mx-auto mt-4 block max-w-[200px] text-[13.5px] leading-snug text-muted">
                          {role.desc}
                        </span>
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
