import { Check } from 'lucide-react'

const rules = [
  ['At least 10 characters', (p) => p.length >= 10],
  ['A letter', (p) => /[A-Za-z]/.test(p)],
  ['A number', (p) => /\d/.test(p)],
]

// Live checklist under a "new password" box
export default function PasswordRules({ value }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[12px]" aria-label="Password rules">
      {rules.map(([label, test]) => {
        const ok = test(value)
        return (
          <li key={label} className={`flex items-center gap-1.5 transition-colors ${ok ? 'text-ink' : 'text-faint'}`}>
            <Check size={12} className={ok ? 'text-rust' : 'opacity-40'} /> {label}
          </li>
        )
      })}
    </ul>
  )
}
