import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import Reveal from '../ui/Reveal'
import Button from '../ui/Button'
import { faqs } from '../../data/content'

function Accordion() {
  const [open, setOpen] = useState(0)

  return (
    <div className="glass rounded-3xl px-6 py-3 sm:px-9">
      {faqs.map((item, i) => {
        const isOpen = open === i
        return (
          <div key={item.q} className={i > 0 ? 'border-t border-ink/10' : ''}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="font-serif text-[20px] leading-snug">{item.q}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid size-6 shrink-0 place-items-center rounded-full border border-ink/20 text-ink/70"
                >
                  {isOpen ? <Minus size={12} /> : <Plus size={12} />}
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-panel-${i}`}
                  role="region"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-[560px] pb-6 text-[14px] leading-[1.7] text-muted">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

const fieldClass =
  'mt-1 w-full border-b border-ink/25 bg-transparent py-3 text-[15px] outline-none transition-colors placeholder:text-faint focus:border-rust'

// Nothing is sent anywhere: this is a front-end pilot. Wire `onSubmit` to your API when ready.
function PilotForm() {
  const [sent, setSent] = useState(false)
  const [role, setRole] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div>
      <p className="eyebrow">Stay informed</p>
      <h3 className="mt-3 font-serif text-[32px] leading-tight">Interested in the pilot?</h3>
      <p className="mt-3 text-[14px] text-muted">Leave your details and we’ll share the next steps.</p>

      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-soft mt-8 rounded-2xl p-6"
          >
            <p className="font-serif text-[22px]">Thank you.</p>
            <p className="mt-2 text-[14px] text-muted">
              Your details were noted in this preview only. Nothing has been sent to a cooperative yet.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-8 space-y-6"
          >
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
              Name
              <input required name="name" placeholder="Your name" className={`${fieldClass} font-normal normal-case tracking-normal`} />
            </label>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
              Phone or email
              <input
                required
                name="contact"
                placeholder="How we can reach you"
                className={`${fieldClass} font-normal normal-case tracking-normal`}
              />
            </label>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.12em]">
              I am a
              <span className="relative mt-1 block">
                <select
                  required
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`${fieldClass} mt-0 appearance-none font-normal normal-case tracking-normal ${role ? '' : 'text-faint'}`}
                >
                  <option value="" disabled>
                    Select your role
                  </option>
                  <option>Customer</option>
                  <option>Worker</option>
                  <option>Cooperative Owner</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2" />
              </span>
            </label>
            <Button type="submit" size="lg" className="w-full">
              Get in touch
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 px-3.5 pt-28 sm:pt-36">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="grid gap-4 lg:grid-cols-[272px_1fr] lg:items-start">
          <p className="eyebrow pt-4">Questions, answered</p>
          <h2 className="font-serif text-[40px] font-normal leading-none tracking-[-0.03em] sm:text-[56px]">
            What to know before you begin.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
          <Reveal>
            <Accordion />
          </Reveal>
          <Reveal delay={0.1} className="lg:pt-2">
            <PilotForm />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
