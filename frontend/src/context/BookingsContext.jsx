import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { exampleBooking } from '../data/content'
import { stamp, todayISO } from '../utils/format'

// Bookings live in this browser only (localStorage), shared by the Customer and Cooperative Admin
// spaces. Swap the reducer actions for API calls later.
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

    case 'confirm': // customer confirms completion
      return state.map((b) =>
        b.id === action.id ? { ...b, confirmation: 'CONFIRMED', review: action.review ?? null } : b,
      )

    case 'allocate': // admin assigns a worker
      return state.map((b) =>
        b.id === action.id
          ? {
              ...b,
              jobStatus: 'ASSIGNED',
              worker: action.worker,
              history: [...b.history, { label: 'Worker allocated', status: 'ASSIGNED', at: stamp() }],
            }
          : b,
      )

    case 'advance': // admin moves the job along: ASSIGNED -> IN_PROGRESS -> COMPLETED
      return state.map((b) => {
        if (b.id !== action.id) return b
        if (b.jobStatus === 'ASSIGNED') {
          return {
            ...b,
            jobStatus: 'IN_PROGRESS',
            history: [...b.history, { label: 'Work started', status: 'IN_PROGRESS', at: stamp() }],
          }
        }
        if (b.jobStatus === 'IN_PROGRESS') {
          return {
            ...b,
            jobStatus: 'COMPLETED',
            verification: 'Awaiting review',
            completedOn: todayISO(),
            history: [...b.history, { label: 'Work completed', status: 'COMPLETED', at: stamp() }],
          }
        }
        return b
      })

    case 'reset':
      return [exampleBooking]

    default:
      return state
  }
}

const pad = (n) => String(n).padStart(2, '0')

export function makeBooking(form) {
  const now = new Date()
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
    history: [{ label: 'Booking requested', status: 'PENDING', at: stamp(now) }],
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
      allocateBooking: (id, worker) => dispatch({ type: 'allocate', id, worker }),
      advanceBooking: (id) => dispatch({ type: 'advance', id }),
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