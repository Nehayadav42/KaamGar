import { z } from 'zod'
import { ALL_ROLES, USER_STATUS } from '../constants/roles.js'
import { email, uuid, pagination, password, personName, phone } from './common.js'

export const createCooperativeSchema = z
  .object({
    name: z.string().trim().min(3).max(120).regex(/^[^<>]*$/, 'Name contains invalid characters'),
    area: z.string().trim().max(120).regex(/^[^<>]*$/).optional(),
  })
  .strict()

export const createCoopAdminSchema = z
  .object({ name: personName, email, password, phone: phone.optional(), cooperativeId: uuid })
  .strict()

export const listUsersQuery = z
  .object({
    role: z.enum(ALL_ROLES).optional(),
    status: z.enum(Object.values(USER_STATUS)).optional(),
    cooperativeId: uuid.optional(),
    search: z.string().trim().max(50).optional(),
    ...pagination,
  })
  .strict()

export const idParams = z.object({ id: uuid }).strict()

// "pending" can only be left, never set, so only these two are allowed
export const updateStatusSchema = z
  .object({ status: z.enum([USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED]) })
  .strict()

export const auditQuery = z
  .object({ action: z.string().trim().max(60).optional(), ...pagination })
  .strict()
