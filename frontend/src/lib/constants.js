// Same list as the backend (kaamgar-api/src/constants/areas.js)
export const AREAS = ['Arera Colony', 'MP Nagar', 'Kolar Road']

export const ROLE_LABEL = {
  customer: 'Customer',
  worker: 'Worker',
  coop_admin: 'Cooperative Owner',
  platform_admin: 'Platform Admin',
}

// Where each role lands after signing in
export const roleHome = (role) =>
  ({ customer: '/customer', worker: '/worker', coop_admin: '/admin', platform_admin: '/admin' })[role] ?? '/'

// The three doors in the role chooser, and which real roles may use each
export const DOORS = {
  customer: { label: 'Customer', roles: ['customer'], canRegister: true },
  worker: { label: 'Worker', roles: ['worker'], canRegister: true },
  owner: { label: 'Cooperative Owner', roles: ['coop_admin', 'platform_admin'], canRegister: false },
}
