import { useState } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import Logo from '../ui/Logo'
import Button from '../ui/Button'

const links = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#benefits', label: 'Benefits' },
  { href: '#faq', label: 'FAQ' },
]

// Floating glass bar. Slides in on load and gets a stronger shadow once you scroll.
export default function Navbar({ onChooseRole }) {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-3.5 top-3.5 z-40 mx-auto max-w-[1320px]"
    >
      <nav
        aria-label="Primary"
        className={`glass flex h-[58px] items-center justify-between rounded-2xl px-3.5 pl-4 transition-shadow duration-500 ${
          scrolled ? 'shadow-[0_18px_40px_-18px_rgba(70,48,30,0.35)]' : ''
        }`}
      >
        <Logo />

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-[14px] font-medium text-ink/90 transition-colors hover:text-rust"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <Button onClick={onChooseRole} className="h-10 px-5">
          Choose your role
        </Button>
      </nav>
    </motion.header>
  )
}
