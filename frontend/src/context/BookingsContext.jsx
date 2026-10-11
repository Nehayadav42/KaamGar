import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { exampleBooking } from '../data/content'

// Bookings live in this browser only (localStorage). Swap the reducer actions for API calls later.
const STORAGE_KEY = 'kaamgar.bookings.v1'

const BookingsContext = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore corrupt storage */
  }
  return [exampleBooking]
}

function reducer(state, action) {
  switch (action.type) {
    case 'add':
      return [action.booking, ...state]
    case 'confirm':
      return state.map((b) =>
        b.id === action.id ? { ...b, confirmation: 'CONFIRMED', review: action.review ?? null } : b,
      )
    case 'reset':
      return [exampleBooking]
    default:
      return state
  }
}

const pad = (n) => String(n).padStart(2, '0')

export function makeBooking(form) {
  const now = new Date()
  const stamp = `${now.getDate()} ${now.toLocaleString('en-IN', { month: 'short' })} ${now.getFullYear()}, ${now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`
  return {
    id: `KG-${pad(now.getMinutes())}${pad(now.getSeconds())}${Math.floor(Math.random() * 90 + 10)}`,
    example: false,
    service: form.service,
    details: form.details.trim(),
    address: form.address.trim(),
    date: form.date,
    time: form.time,
    contact: form.contact.trim(),
    jobStatus: 'PENDING',
    verification: 'Awaiting work evidence',
    confirmation: 'PENDING',
    review: null,
    worker: null,
    history: [{ label: 'Booking requested', status: 'PENDING', at: stamp }],
  }
}

export function BookingsProvider({ children }) {
  const [bookings, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
    } catch {
      /* storage full or blocked: keep working in memory */
    }
  }, [bookings])

  const value = useMemo(
    () => ({
      bookings,
      addBooking: (booking) => dispatch({ type: 'add', booking }),
      confirmBooking: (id, review) => dispatch({ type: 'confirm', id, review }),
      resetBookings: () => dispatch({ type: 'reset' }),
    }),
    [bookings],
  )

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>
}

export function useBookings() {
  const ctx = useContext(BookingsContext)
  if (!ctx) throw new Error('useBookings must be used inside <BookingsProvider>')
  return ctx
}
