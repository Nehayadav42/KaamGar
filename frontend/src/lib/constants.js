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
  ({ customer: '/customer', worker: '/worker', coop_admin: '/admin', platform_admin: '/platform' })[role] ?? '/'

// The sign-in doors, and which real roles may use each one.
// The first three are in the role chooser. "platform" has its own page: /platform/login.
export const DOORS = {
  customer: { label: 'Customer', roles: ['customer'], canRegister: true },
  worker: { label: 'Worker', roles: ['worker'], canRegister: true },
  owner: { label: 'Cooperative Owner', roles: ['coop_admin'], canRegister: false },
  platform: { label: 'Platform Admin', roles: ['platform_admin'], canRegister: false },
}
