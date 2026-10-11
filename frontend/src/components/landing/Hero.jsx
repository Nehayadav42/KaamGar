import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import Button from '../ui/Button'

const ease = [0.22, 1, 0.36, 1]
const container = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
}

const rows = [
  ['Job status', 'Completed'],
  ['Verification', 'Under review'],
  ['Your confirmation', 'Pending'],
]

export default function Hero({ onChooseRole }) {
  const [photoOk, setPhotoOk] = useState(true)

  return (
    <section className="px-3.5 pt-[84px]">
      <div className="glass mx-auto grid max-w-[1320px] gap-3.5 rounded-[28px] p-3.5 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        {/* Copy */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:py-14 lg:pl-[50px] lg:pr-6"
        >
          <motion.p variants={item} className="eyebrow">
            Local work, with a clear record
          </motion.p>
          <motion.h1
            variants={item}
            className="mt-5 max-w-[480px] font-serif text-[52px] font-normal leading-[0.98] tracking-[-0.03em] sm:text-[64px] xl:text-[72px]"
          >
            Trusted local work, recorded and proven.
          </motion.h1>
          <motion.p variants={item} className="mt-7 max-w-[420px] text-[16px] leading-[1.65] text-muted">
            Built for labour cooperatives, customers and workers in Bhopal to book, complete and
            verify local service work.
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Button size="lg" onClick={onChooseRole}>
              Choose your role
            </Button>
            <a
              href="#how-it-works"
              className="group inline-flex items-center gap-2 border-b border-ink pb-0.5 text-[14px] font-medium transition-colors hover:border-rust hover:text-rust"
            >
              See how it works
              <ArrowDown size={14} className="transition-transform group-hover:translate-y-0.5" />
            </a>
          </motion.div>
          <motion.p variants={item} className="eyebrow mt-10 text-[10.5px] text-faint">
            Arera Colony · MP Nagar · Kolar Road
          </motion.p>
        </motion.div>

        {/* Photo + floating booking card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease, delay: 0.2 }}
          className="relative min-h-[420px] overflow-hidden rounded-[22px] bg-gradient-to-br from-[#4a3f36] via-[#8a7260] to-[#c9b49c] sm:min-h-[560px]"
        >
          {photoOk && (
            <img
              src="/images/hero.jpg"
              alt="Hands holding a power drill during a repair job"
              className="absolute inset-0 size-full object-cover"
              onError={() => setPhotoOk(false)}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
          {/* <p className="absolute right-5 top-4 text-[10.5px] text-white/85">
            Photo: Theme Photos / Unsplash
          </p> */}

          <motion.article
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.7 }}
            whileHover={{ y: -4 }}
            className="absolute bottom-5 right-5 w-[min(332px,calc(100%-2.5rem))] rounded-2xl border border-white/50 bg-white/55 p-5 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <p className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink/70">
              <span className="size-1.5 rounded-full bg-rust" />
              Booking KG-0241
            </p>
            <h2 className="mt-3 font-serif text-[24px] leading-tight">Faucet repair</h2>
            <p className="mt-1 text-[13px] text-muted">Arera Colony, Bhopal</p>
            <dl className="mt-4 text-[13px]">
              {rows.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-t border-ink/10 py-2.5"
                >
                  <dt className="text-muted">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </motion.article>
        </motion.div>
      </div>
    </section>
  )
}
