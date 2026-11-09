import { z } from 'zod'
import { AREAS } from '../constants/areas.js'
import { ALL_ROLES, USER_STATUS } from '../constants/roles.js'
import { dedupe, email, pagination, personName, phone, shramikCard, uuid } from './common.js'

export const createCooperativeSchema = z
  .object({
    name: z.string().trim().min(3).max(120).regex(/^[^<>]*$/, 'Name contains invalid characters'),
    area: z.string().trim().max(120).regex(/^[^<>]*$/).optional(),
  })
  .strict()

// No password here: the new cooperative admin chooses their own through an emailed link
export const createCoopAdminSchema = z
  .object({ name: personName, email, phone: phone.optional(), cooperativeId: uuid })
  .strict()

const noTags = /^[^<>]*$/
const profileCore = {
  serviceIds: z.array(uuid).min(1, 'Choose at least one skill').max(20).transform(dedupe),
  areas: z.array(z.enum(AREAS)).min(1, 'Choose at least one area').transform(dedupe),
  availability: z.string().trim().min(1).max(60).regex(noTags),
  note: z.string().trim().max(120).regex(noTags).nullable().optional(),
  shramikCardNumber: shramikCard.optional(),
}
// Approving a worker: the cooperative admin may correct the details first
export const approveWorkerSchema = z.object(profileCore).strict()
export const declineWorkerSchema = z
  .object({ reason: z.string().trim().min(3, 'Give a short reason').max(200).regex(noTags, 'Reason contains invalid characters') })
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
