export default function PlatformHeading({ eyebrow = 'KaamGar platform', title, children }) {
  return (
    <header>
      <p className="eyebrow text-[10.5px]">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-[44px] font-normal leading-[1.02] tracking-[-0.03em] sm:text-[60px] md:text-[68px]">{title}</h1>
      {children}
    </header>
  )
}
