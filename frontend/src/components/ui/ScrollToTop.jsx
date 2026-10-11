import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Jump to the top when the route changes (not for in-page #anchors).
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  return null
}
