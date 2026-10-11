import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

// Primary = rust rounded button with a soft shadow, ghost = underlined text link.
export default function Button({
  children,
  variant = 'primary',
  arrow = true,
  size = 'md',
  className = '',
  ...props
}) {
  if (variant === 'ghost') {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        className={`inline-flex items-center gap-2 border-b border-ink pb-0.5 text-[14px] font-medium text-ink transition-colors hover:border-rust hover:text-rust ${className}`}
        {...props}
      >
        {children}
      </motion.button>
    )
  }

  const sizes = size === 'lg' ? 'h-12 px-6' : 'h-11 px-5'
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={`inline-flex items-center justify-center gap-2.5 rounded-xl bg-rust text-[14px] font-semibold text-white shadow-[0_12px_26px_-12px_rgba(161,69,55,0.85)] transition-colors hover:bg-rust-deep disabled:cursor-not-allowed disabled:bg-faint disabled:shadow-none ${sizes} ${className}`}
      {...props}
    >
      {children}
      {arrow && <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />}
    </motion.button>
  )
}
