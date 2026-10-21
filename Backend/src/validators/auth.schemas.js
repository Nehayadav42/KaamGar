import { z } from 'zod'
import { ROLES, SELF_REGISTER_ROLES } from '../constants/roles.js'
import { email, uuid, password, personName, phone } from './common.js'

export const registerSchema = z
  .object({
    name: personName,
    email,
    password,
    phone: phone.optional(),
    // Only customer or worker. "platform_admin" / "coop_admin" are rejected here.
    role: z.enum(SELF_REGISTER_ROLES).default(ROLES.CUSTOMER),
    cooperativeId: uuid.optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.role === ROLES.WORKER && !data.cooperativeId) {
      ctx.addIssue({ code: 'custom', path: ['cooperativeId'], message: 'Workers must choose a cooperative' })
    }
    if (data.role === ROLES.CUSTOMER && data.cooperativeId) {
      ctx.addIssue({ code: 'custom', path: ['cooperativeId'], message: 'Customers do not belong to a cooperative' })
    }
  })

export const loginSchema = z
  .object({ email, password: z.string().min(1, 'Password is required').max(128) })
  .strict()

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1).max(128), newPassword: password })
  .strict()
  .refine((d) => d.currentPassword !== d.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current one',
  })
