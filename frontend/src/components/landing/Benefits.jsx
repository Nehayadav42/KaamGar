import { motion } from 'framer-motion'
import Reveal from '../ui/Reveal'
import { benefits } from '../../data/content'

export default function Benefits() {
  return (
    <section id="benefits" className="scroll-mt-24 px-3.5 pt-28 sm:pt-36">
      <div className="mx-auto max-w-[1320px]">
        <Reveal>
          <p className="eyebrow">Benefits for everyone</p>
        </Reveal>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {benefits.map((b, i) => (
            <motion.article
              key={b.tag}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="glass flex min-h-[420px] flex-col rounded-3xl p-7 md:min-h-[370px]"
            >
              <p className="w-fit border-b border-rust pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-rust">
                {b.tag}
              </p>
              <div className="mt-20 sm:mt-[88px]">
                <h3 className="max-w-[300px] font-serif text-[27px] leading-[1.15] tracking-[-0.01em]">
                  {b.title}
                </h3>
                <p className="mt-4 max-w-[330px] text-[14px] leading-[1.7] text-muted">{b.text}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
