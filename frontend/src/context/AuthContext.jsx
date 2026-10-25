import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, refreshSession, setAccessToken, setSessionLostHandler } from '../lib/api'

const AuthContext = createContext(null)
const HAS_ACCOUNT_KEY = 'kaamgar.hasAccount' // only remembers "this browser has signed in before"

export const hasSignedInBefore = () => {
  try {
    return localStorage.getItem(HAS_ACCOUNT_KEY) === '1'
  } catch {
    return false
  }
}
const rememberAccount = () => {
  try {
    localStorage.setItem(HAS_ACCOUNT_KEY, '1')
  } catch {
    /* private mode: ignore */
  }
}

export function AuthProvider({ children }) {
  // status: 'loading' (checking for an existing session) | 'authenticated' | 'anonymous'
  const [state, setState] = useState({ status: 'loading', user: null })

  const signedOut = useCallback(() => {
    setAccessToken(null)
    setState({ status: 'anonymous', user: null })
  }, [])

  // On every page load: the refresh cookie (if any) quietly signs the person back in
  useEffect(() => {
    setSessionLostHandler(signedOut)
    refreshSession()
      .then((d) => setState({ status: 'authenticated', user: d.user }))
      .catch(signedOut)
  }, [signedOut])

  const accept = useCallback((data) => {
    setAccessToken(data.accessToken)
    rememberAccount()
    setState({ status: 'authenticated', user: data.user })
    return data.user
  }, [])

  const login = useCallback(async (email, password) => accept(await api.auth.login({ email, password })), [accept])
  const register = useCallback(async (body) => accept(await api.auth.register(body)), [accept])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch {
      /* even if the call fails, sign out on this device */
    }
    signedOut()
  }, [signedOut])

  // Called after a password change (the server issues a fresh token) or to reload the user
  const refreshUser = useCallback(async (newToken) => {
    if (newToken) setAccessToken(newToken)
    const { user } = await api.auth.me()
    setState({ status: 'authenticated', user })
    return user
  }, [])

  const value = useMemo(() => ({ ...state, login, register, logout, refreshUser }), [state, login, register, logout, refreshUser])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
