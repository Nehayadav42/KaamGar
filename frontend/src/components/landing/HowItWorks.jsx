import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import Reveal from '../ui/Reveal'
import { steps } from '../../data/content'

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 px-3.5 pt-28 sm:pt-36">
      <div className="mx-auto max-w-[1320px]">
        <Reveal className="grid gap-6 lg:grid-cols-[272px_1fr_330px] lg:items-start">
          <p className="eyebrow pt-3">How it works</p>
          <h2 className="max-w-[460px] font-serif text-[40px] font-normal leading-[0.98] tracking-[-0.03em] sm:text-[56px]">
            One clear path from request to record.
          </h2>
          <p className="pt-3 text-[15px] leading-[1.7] text-muted">
            Everyone can see what happens next, from a customer’s booking to a worker’s verified Work
            Passport entry.
          </p>
        </Reveal>

        <ol className="mt-16 grid border-y border-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              className="group border-line px-6 pb-8 pt-7 transition-colors duration-500 hover:bg-white/40 sm:[&:nth-child(even)]:border-l lg:border-l lg:first:border-l-0 lg:[&:nth-child(even)]:border-l"
            >
              <span className="text-[12px] text-rust">{s.n}</span>
              <h3 className="mt-9 font-serif text-[26px] leading-none">{s.title}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-muted">{s.text}</p>
            </motion.li>
          ))}
        </ol>

        <Reveal className="mx-auto mt-12 flex max-w-[1000px] flex-col gap-4 rounded-2xl bg-ink px-7 py-6 text-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/25">
              <Check size={16} />
            </span>
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/55">
                The result
              </p>
              <p className="mt-1 font-serif text-[22px] leading-tight">A verified Work Passport record</p>
            </div>
          </div>
          <p className="text-[12.5px] text-white/65">Owned by the worker. Backed by real completed work.</p>
        </Reveal>
      </div>
    </section>
  )
}
