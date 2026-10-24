// The four roles of KaamGar. Never trust a role that comes from the client.
export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  WORKER: 'worker',
  COOP_ADMIN: 'coop_admin',
  PLATFORM_ADMIN: 'platform_admin',
})

export const ALL_ROLES = Object.values(ROLES)

// Roles a person may pick for themselves when they sign up.
export const SELF_REGISTER_ROLES = [ROLES.CUSTOMER, ROLES.WORKER]

export const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  PENDING: 'pending', // new workers wait for their cooperative to approve them
  SUSPENDED: 'suspended',
})

export const BOOKING_STATUSES = [
  'PENDING',
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'EVIDENCE_SUBMITTED',
  'COMPLETED',
  'CANCELLED',
]
