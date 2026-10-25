// Small loading indicator that matches the design (a thin rotating ring)
export default function Spinner({ label = 'Loading', className = '' }) {
    return (
      <span role="status" aria-live="polite" className={`inline-flex items-center gap-3 text-[13px] text-muted ${className}`}>
        <span className="size-4 animate-spin rounded-full border border-ink/20 border-t-ink" aria-hidden="true" />
        {label}
      </span>
    )
  }
  
  export function FullScreenLoader() {
    return (
      <div className="landing-backdrop grid min-h-screen place-items-center">
        <Spinner label="Opening KaamGar" />
      </div>
    )
  }
  