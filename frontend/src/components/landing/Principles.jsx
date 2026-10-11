import { motion } from 'framer-motion'
import Reveal from '../ui/Reveal'
import { principles } from '../../data/content'

export default function Principles() {
  return (
    <section className="px-3.5 pt-28 sm:pt-36">
      <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <Reveal>
          <p className="eyebrow">Our principles</p>
          <h2 className="mt-3 max-w-[440px] font-serif text-[40px] font-normal leading-[0.98] tracking-[-0.03em] sm:text-[56px]">
            Trust comes from clarity, not claims.
          </h2>
          <p className="mt-7 max-w-[400px] text-[15px] leading-[1.7] text-muted">
            KaamGar is an early pilot. Our approach is built around human judgement, worker agency and
            useful records.
          </p>
          <div className="mt-12 flex items-center gap-4">
            <div className="grid h-16 w-[118px] shrink-0 place-items-center rounded-xl border border-dashed border-ink/20 bg-white/30 px-2 text-center">
              <div>
                <p className="text-[10.5px] font-medium">Partner cooperative logo</p>
                <p className="mt-0.5 text-[9.5px] text-faint">To be added later</p>
              </div>
            </div>
            <p className="max-w-[150px] text-[12.5px] font-semibold leading-snug">
              Built for the Bhopal cooperative pilot
            </p>
          </div>
        </Reveal>

        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map((p, i) => (
              <motion.article
                key={p.n}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                whileHover={{ y: -5 }}
                className="glass flex min-h-[200px] flex-col justify-between rounded-3xl p-6"
              >
                <span className="text-[12px] text-rust">{p.n}</span>
                <div>
                  <h3 className="font-serif text-[24px] leading-tight">{p.title}</h3>
                  <p className="mt-1.5 text-[13px] text-muted">{p.sub}</p>
                </div>
              </motion.article>
            ))}
          </div>

          <Reveal className="mt-4 grid h-[72px] place-items-center rounded-2xl border border-dashed border-ink/20 bg-white/25">
            <p className="eyebrow text-[10.5px]">Testimonials coming after pilot</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
