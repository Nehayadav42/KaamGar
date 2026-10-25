import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import AccountMenu from '../components/ui/AccountMenu'
import Logo from '../components/ui/Logo'
import { useAuth } from '../context/AuthContext'

// Placeholder until the worker space is built. It already respects the approval step.
export default function WorkerHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const pending = user.status === 'pending'

  return (
    <div className="landing-backdrop min-h-screen">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-6 sm:px-[60px]">
        <div className="flex items-baseline gap-3">
          <Logo mark={false} />
          <span className="eyebrow text-[10px]">Worker</span>
        </div>
        <AccountMenu />
      </div>
      <div className="grid place-items-center px-4 pb-24 pt-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="glass w-full max-w-[560px] rounded-[28px] p-10 text-center">
          <p className="eyebrow">{pending ? 'Waiting for approval' : 'Approved'}</p>
          <h1 className="mt-3 font-serif text-[40px] leading-[1.05] tracking-[-0.03em]">
            {pending ? 'Your cooperative will review your account.' : `Welcome, ${user.name.split(' ')[0]}.`}
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed text-muted">
            {pending
              ? 'A cooperative admin approves every worker before they can take jobs. Check back soon.'
              : 'The worker space (jobs, evidence and your Work Passport) is coming next.'}
          </p>
          <button type="button" onClick={() => navigate('/')} className="mt-8 border-b border-ink pb-0.5 text-[13px] font-medium hover:border-rust hover:text-rust">
            Back to start
          </button>
        </motion.div>
      </div>
    </div>
  )
}
