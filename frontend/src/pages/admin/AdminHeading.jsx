import { useCooperativeName } from '../../hooks/useCooperative'

// Eyebrow + big serif title + the "local prototype" note shown on every admin screen.
export default function AdminHeading({ title, eyebrow, lead, children }) {
  const coopName = useCooperativeName()
  return (
    <header>
      <p className="eyebrow text-[10.5px]">{eyebrow ?? coopName}</p>
      <h1 className="mt-3 font-serif text-[44px] font-normal leading-[1.02] tracking-[-0.03em] sm:text-[60px] md:text-[68px]">{title}</h1>
      {lead}
      <p className="mt-6 max-w-[780px] text-[12px] leading-relaxed text-muted">
        Local prototype · Bookings, services and workers on this screen come from the KaamGar database. Worker evidence tools and messaging are not connected yet.
      </p>
      {children}
    </header>
  )
}
