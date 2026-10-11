import { Link } from 'react-router-dom'

export default function Logo({ mark = true, className = '' }) {
  return (
    <Link to="/" aria-label="KaamGar home" className={`flex items-center gap-2.5 ${className}`}>
      {mark && (
        <span className="grid size-7 place-items-center rounded-full bg-ink font-serif text-[15px] leading-none text-white">
          K
        </span>
      )}
      <span className="font-serif text-[21px] leading-none tracking-[-0.01em]">KaamGar</span>
    </Link>
  )
}
