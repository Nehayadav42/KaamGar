import Button from './Button'

// Shown when a page could not load its data
export default function ErrorNote({ error, onRetry }) {
  return (
    <div role="alert" className="glass-soft rounded-2xl p-6">
      <p className="font-serif text-[22px]">We couldn’t load this.</p>
      <p className="mt-2 text-[13px] text-muted">{error?.message ?? 'Something went wrong.'}</p>
      {onRetry && (
        <div className="mt-5">
          <Button arrow={false} onClick={() => onRetry()}>
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}
