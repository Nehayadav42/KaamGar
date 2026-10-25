import { useCallback, useEffect, useRef, useState } from 'react'

// Loads data when the page opens (and again when `deps` change). `reload()` fetches it again.
//   const { data, error, loading, reload } = useAsync(() => api.bookings.mine(), [])
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const fnRef = useRef(fn)
  fnRef.current = fn
  const alive = useRef(true)

  const run = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fnRef.current()
      if (alive.current) setState({ data, error: null, loading: false })
    } catch (error) {
      if (alive.current) setState((s) => ({ data: silent ? s.data : null, error, loading: false }))
    }
  }, [])

  useEffect(() => {
    alive.current = true
    run()
    return () => {
      alive.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ...state, reload: run }
}
