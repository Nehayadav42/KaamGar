import Reveal from '../ui/Reveal'
import Button from '../ui/Button'

export default function ClosingCta({ onChooseRole }) {
  return (
    <section className="px-3.5 pt-28 sm:pt-36">
      <Reveal className="glass mx-auto max-w-[1320px] rounded-[32px] px-6 pb-9 pt-16 text-center sm:pt-20">
        <p className="eyebrow">Work that stays with you</p>
        <h2 className="mx-auto mt-5 max-w-[640px] font-serif text-[40px] font-normal leading-[1.02] tracking-[-0.03em] sm:text-[56px]">
          Start with one job. Build a record that lasts.
        </h2>
        <div className="mt-9">
          <Button size="lg" onClick={onChooseRole}>
            Choose your role
          </Button>
        </div>
        <div className="mx-auto mt-14 max-w-[1100px] border-t border-ink/10 pt-6">
          <p className="text-[12px] text-muted">Every action is logged. People make the final decisions.</p>
        </div>
      </Reveal>
    </section>
  )
}
