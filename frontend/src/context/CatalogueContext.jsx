import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { ORG, seedServices } from '../data/admin'
import { stamp } from '../utils/format'

// The service catalogue is shared: the admin edits it, customers only see ACTIVE services.
const STORAGE_KEY = 'kaamgar.catalogue.v1'

const CatalogueContext = createContext(null)

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore corrupt storage */
  }
  return seedServices
}

const log = (text) => ({ text, at: stamp() })

function reducer(state, action) {
  switch (action.type) {
    case 'add':
      return [
        ...state,
        { ...action.service, active: false, activity: [log(`Service added as Inactive by ${ORG.admin}`)] },
      ]
    case 'update':
      return state.map((s) =>
        s.id === action.id
          ? { ...s, ...action.patch, activity: [...s.activity, log(`Details updated by ${ORG.admin}`)] }
          : s,
      )
    case 'setActive':
      return state.map((s) =>
        s.id === action.id
          ? {
              ...s,
              active: action.active,
              activity: [...s.activity, log(`${action.active ? 'Activated' : 'Deactivated'} by ${ORG.admin}`)],
            }
          : s,
      )
    case 'reset':
      return seedServices
    default:
      return state
  }
}

export function CatalogueProvider({ children }) {
  const [services, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(services))
    } catch {
      /* keep working in memory */
    }
  }, [services])

  const value = useMemo(
    () => ({
      services,
      activeServices: services.filter((s) => s.active),
      addService: (service) => dispatch({ type: 'add', service }),
      updateService: (id, patch) => dispatch({ type: 'update', id, patch }),
      setServiceActive: (id, active) => dispatch({ type: 'setActive', id, active }),
      resetCatalogue: () => dispatch({ type: 'reset' }),
    }),
    [services],
  )

  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>
}

export function useCatalogue() {
  const ctx = useContext(CatalogueContext)
  if (!ctx) throw new Error('useCatalogue must be used inside <CatalogueProvider>')
  return ctx
}