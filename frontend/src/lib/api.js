// The only file that talks to the backend.
//  - the short-lived access token lives in memory (never in localStorage)
//  - the refresh token is an httpOnly cookie the browser sends by itself (credentials: 'include')
//  - when the access token expires, one refresh is made and the failed request is retried
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

let accessToken = null
let onSessionLost = () => {}
let refreshing = null // makes parallel requests share ONE refresh call

export const setAccessToken = (token) => {
  accessToken = token
}
export const setSessionLostHandler = (fn) => {
  onSessionLost = fn
}

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

async function send(path, { method = 'GET', body, auth = true } = {}) {
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: 'include',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection and try again.')
  }
  let json = null
  try {
    json = await res.json()
  } catch {
    /* empty body */
  }
  return { ok: res.ok, status: res.status, json }
}

// Swaps the refresh cookie for a new access token. Only one runs at a time.
export function refreshSession() {
  if (!refreshing) {
    refreshing = send('/auth/refresh', { method: 'POST', auth: false })
      .then((r) => {
        if (!r.ok) throw new ApiError(r.status, r.json?.error?.code ?? 'UNAUTHORIZED', 'Session expired')
        accessToken = r.json.data.accessToken
        return r.json.data
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

async function request(path, opts = {}) {
  let r = await send(path, opts)

  if (!r.ok && r.status === 401 && opts.auth !== false && r.json?.error?.code === 'TOKEN_EXPIRED') {
    try {
      await refreshSession()
    } catch {
      accessToken = null
      onSessionLost()
      throw new ApiError(401, 'SESSION_EXPIRED', 'Your session expired. Please log in again.')
    }
    r = await send(path, opts)
  }

  if (!r.ok) {
    const e = r.json?.error
    if (r.status === 401 && opts.auth !== false && e?.code === 'SESSION_REVOKED') {
      accessToken = null
      onSessionLost()
    }
    throw new ApiError(r.status, e?.code ?? 'ERROR', e?.message ?? 'Something went wrong', e?.details)
  }
  return r.json.data
}

const qs = (params = {}) => {
  const p = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
  return p.toString() ? `?${p}` : ''
}
const get = (path) => request(path)
const post = (path, body) => request(path, { method: 'POST', body })
const patch = (path, body) => request(path, { method: 'PATCH', body })

export const api = {
  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body, auth: false }),
    login: (body) => request('/auth/login', { method: 'POST', body, auth: false }),
    logout: () => request('/auth/logout', { method: 'POST', auth: false }),
    me: () => get('/auth/me'),
    changePassword: (body) => patch('/auth/change-password', body),
  },
  cooperatives: { list: () => request('/cooperatives', { auth: false }) },
  services: { catalogue: () => get('/services') },
  bookings: {
    create: (body) => post('/bookings', body),
    mine: (params) => get(`/bookings${qs(params)}`),
    get: (id) => get(`/bookings/${id}`),
    confirm: (id, body = {}) => post(`/bookings/${id}/confirm`, body),
  },
  admin: {
    overview: () => get('/admin/overview'),
    bookings: (params) => get(`/admin/bookings${qs(params)}`),
    eligibleWorkers: (id) => get(`/admin/bookings/${id}/eligible-workers`),
    allocate: (id, workerId) => post(`/admin/bookings/${id}/allocate`, { workerId }),
    advance: (id) => post(`/admin/bookings/${id}/advance`),
    workers: () => get('/admin/workers'),
    updateWorkerProfile: (id, body) => patch(`/admin/workers/${id}/profile`, body),
    setUserStatus: (id, status) => patch(`/admin/users/${id}/status`, { status }),
    services: {
      list: () => get('/admin/services'),
      get: (id) => get(`/admin/services/${id}`),
      create: (body) => post('/admin/services', body),
      update: (id, body) => patch(`/admin/services/${id}`, body),
      activate: (id) => post(`/admin/services/${id}/activate`),
      deactivate: (id) => post(`/admin/services/${id}/deactivate`),
    },
  },
}
