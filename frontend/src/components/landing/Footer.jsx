export default function Footer() {
  return (
    <footer className="px-3.5 pb-10 pt-24">
      <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-5 border-t border-ink/10 pt-8 text-[13px] sm:flex-row">
        <span className="font-serif text-[22px] leading-none">KaamGar</span>
        <ul className="flex gap-7 text-ink/80">
          <li><a href="#how-it-works" className="hover:text-rust">How it works</a></li>
          <li><a href="#benefits" className="hover:text-rust">Benefits</a></li>
          <li><a href="#faq" className="hover:text-rust">FAQ</a></li>
        </ul>
        <span className="text-muted">Built for Bhopal</span>
      </div>
    </footer>
  )
}
