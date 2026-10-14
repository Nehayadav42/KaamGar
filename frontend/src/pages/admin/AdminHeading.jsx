import { ORG } from '../../data/admin'

// Eyebrow + big serif title + the "local prototype" note shown on every admin screen.
export default function AdminHeading({ title, eyebrow = ORG.name, lead, children }) {
  return (
    <header>
      <p className="eyebrow text-[10.5px]">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-[44px] font-normal leading-[1.02] tracking-[-0.03em] sm:text-[60px] md:text-[68px]">
        {title}
      </h1>
      {lead}
      <p className="mt-6 max-w-[780px] text-[12px] leading-relaxed text-muted">
        Local prototype · Customer bookings are shared on this browser. Member names and availability form an
        illustrative roster, not live cooperative records. No authentication or messages are connected.
      </p>
      {children}
    </header>
  )
}