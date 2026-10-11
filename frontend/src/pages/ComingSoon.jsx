import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/ui/Logo'

// Placeholder for the Worker and Cooperative Owner areas.
export default function ComingSoon({ title }) {
  return (
    <div className="landing-backdrop grid min-h-screen place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="glass w-full max-w-[560px] rounded-[28px] p-10 text-center"
      >
        <Logo className="justify-center" />
        <p className="eyebrow mt-10">Coming next</p>
        <h1 className="mt-3 font-serif text-[48px] leading-none tracking-[-0.03em]">{title}</h1>
        <p className="mt-5 text-[14px] text-muted">This area hasn’t been built yet.</p>
        <Link
          to="/"
          className="mt-8 inline-block border-b border-ink pb-0.5 text-[14px] font-medium hover:border-rust hover:text-rust"
        >
          Back to start
        </Link>
      </motion.div>
    </div>
  )
}
