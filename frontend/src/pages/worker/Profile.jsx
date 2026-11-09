import { useOutletContext } from 'react-router-dom'
import Spinner from '../../components/ui/Spinner'

export default function Profile() {
  const { profile: w } = useOutletContext()
  if (!w) return <Spinner label="Loading" />
  const rows = [['Name', w.name], ['Email', w.email], ['Mobile', w.phone], ['Shramik card', w.shramikCardNumber], ['Skills', w.skills.join(', ') || '—'], ['Areas', w.areas.join(', ') || '—'], ['Availability', `${w.availability}${w.note ? ` · ${w.note}` : ''}`], ['Verification', w.details]]
  return (
    <>
      <p className="eyebrow text-[10.5px]">Your record</p>
      <h1 className="mt-3 font-serif text-[48px] leading-[1.02] tracking-[-0.03em] sm:text-[60px]">My details.</h1>
      <p className="mt-6 max-w-[520px] text-[14px] leading-relaxed text-muted">Your cooperative owner checked these. To change skills, areas or availability, ask your cooperative owner.</p>
      <dl className="mt-10 border-t border-line text-[14px]">
        {rows.map(([k, v]) => (<div key={k} className="grid grid-cols-[140px_1fr] gap-4 border-b border-line py-3.5"><dt className="text-muted">{k}</dt><dd className="break-words">{v}</dd></div>))}
      </dl>
    </>
  )
}
