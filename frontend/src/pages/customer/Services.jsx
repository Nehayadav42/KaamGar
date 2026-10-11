import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import PageHeading from './PageHeading'
import Button from '../../components/ui/Button'
import { services } from '../../data/content'

const ease = [0.22, 1, 0.36, 1]

export default function Services() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(services[0].id)

  const next = () => navigate('/customer/book', { state: { serviceId: selected } })

  return (
    <>
      <PageHeading title="What can we help with?" />
      <p className="mt-10 max-w-[470px] text-[15px] leading-[1.7] text-muted">
        Thoughtful help for everyday repairs and upkeep. Choose what you need; your cooperative handles
        the allocation.
      </p>

      <div role="radiogroup" aria-label="Choose a service" className="mt-12 border-t border-line">
        {services.map((s, i) => {
          const on = s.id === selected
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.15 + i * 0.08 }}
              className="border-b border-line"
            >
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setSelected(s.id)}
                className={`relative grid w-full grid-cols-[36px_1fr_auto] items-start gap-x-4 px-3 py-7 text-left transition-colors sm:grid-cols-[44px_1fr_auto] ${
                  on ? 'bg-white/55' : 'hover:bg-white/30'
                }`}
              >
                {/* Animated selection outline that glides between rows */}
                {on && (
                  <motion.span
                    layoutId="service-outline"
                    className="pointer-events-none absolute inset-0 border border-ink"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="pt-2 text-[12px] text-faint">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <span className="block font-serif text-[28px] leading-tight tracking-[-0.01em]">{s.name}</span>
                  <span className="mt-2 block text-[13.5px] text-muted">{s.desc}</span>
                  <span className="mt-2.5 block text-[11px] text-faint">{s.areas.join(' · ')}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-2 grid size-4 place-items-center rounded-full border transition-colors ${
                    on ? 'border-ink' : 'border-ink/35'
                  }`}
                >
                  <motion.span
                    animate={{ scale: on ? 1 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                    className="size-2 rounded-full bg-ink"
                  />
                </span>
              </button>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-[12px] text-muted">No payments in this pilot.</p>
        <Button size="lg" onClick={next}>
          Select service
        </Button>
      </div>
    </>
  )
}
