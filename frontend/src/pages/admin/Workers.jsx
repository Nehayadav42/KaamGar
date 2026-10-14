import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AdminHeading from './AdminHeading'
import { workers } from '../../data/admin'

const ease = [0.22, 1, 0.36, 1]
const cols = 'sm:grid-cols-[0.8fr_1.6fr_1.8fr_1.3fr_1fr_1.2fr]'

export default function Workers() {
  const [open, setOpen] = useState(null)

  return (
    <>
      <AdminHeading title="People behind the work.">
        <p className="mt-10 max-w-[560px] text-[15px] leading-[1.7] text-muted">
          Skills, service areas and availability—visible to everyone coordinating the work. Member records
          here are illustrative; no rankings or scores.
        </p>
      </AdminHeading>

      <div className="mt-12 overflow-x-auto">
        <div className="min-w-[860px]">
          <div className={`hidden gap-4 border-t border-line py-4 sm:grid ${cols} eyebrow text-[10px]`}>
            <span>Name</span>
            <span>Skills</span>
            <span>Service areas</span>
            <span>Availability</span>
            <span>Status</span>
            <span>Details</span>
          </div>

          {workers.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.05 + i * 0.05 }}
              className="border-t border-line"
            >
              <div className={`grid gap-4 py-5 text-[13px] ${cols}`}>
                <button
                  type="button"
                  aria-expanded={open === w.id}
                  onClick={() => setOpen(open === w.id ? null : w.id)}
                  className="w-fit border-b border-ink/50 text-left font-medium hover:border-rust hover:text-rust"
                >
                  {w.name}
                </button>
                <span>{w.skills.join(', ')}</span>
                <span>{w.areas.join(', ')}</span>
                <span>
                  {w.availability}
                  {w.note && <span className="mt-1 block text-[11.5px] text-muted">{w.note}</span>}
                </span>
                <span className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-ink" />
                  {w.status}
                </span>
                <span>{w.details}</span>
              </div>
              <AnimatePresence initial={false}>
                {open === w.id && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease }}
                    className="overflow-hidden pb-5 text-[12px] leading-relaxed text-muted"
                  >
                    Illustrative member record for this prototype. Skills and availability are{' '}
                    {w.details === 'Self-declared' ? 'self-declared and not yet reviewed' : 'reviewed by the cooperative'};
                    nothing here is a ranking or a score.
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          <div className="border-t border-line" />
        </div>
      </div>
    </>
  )
}