// Eyebrow + big serif heading + pilot note, shared by every customer screen.
export default function PageHeading({ title, children }) {
  return (
    <header>
      <p className="eyebrow text-[10.5px]">Local service · Clear records</p>
      <h1 className="mt-3 font-serif text-[44px] font-normal leading-[1.02] tracking-[-0.03em] sm:text-[60px] md:text-[68px]">
        {title}
      </h1>
      <p className="mt-6 max-w-[620px] text-[12px] leading-relaxed text-muted">
        Frontend pilot preview. Bookings and reviews stay on this browser only; no requests are sent to a
        cooperative.
      </p>
      {children}
    </header>
  )
}
