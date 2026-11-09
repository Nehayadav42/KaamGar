import { z } from 'zod'
import { AREAS } from '../constants/areas.js'
import { ROLES, SELF_REGISTER_ROLES } from '../constants/roles.js'
import { dedupe, email, password, personName, phone, shramikCard, uuid } from './common.js'

export const DOORS = ['customer', 'worker', 'owner', 'platform']

export const registerSchema = z
  .object({
    name: personName,
    email,
    password,
    phone: phone.optional(),
    // Only customer or worker. "platform_admin" / "coop_admin" are rejected here.
    role: z.enum(SELF_REGISTER_ROLES).default(ROLES.CUSTOMER),
    // Workers only:
    cooperativeId: uuid.optional(),
    shramikCardNumber: shramikCard.optional(),
    serviceIds: z.array(uuid).min(1, 'Choose at least one skill').max(20).transform(dedupe).optional(),
    areas: z.array(z.enum(AREAS)).min(1, 'Choose at least one area').transform(dedupe).optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    const need = (field, message) => ctx.addIssue({ code: 'custom', path: [field], message })
    if (d.role === ROLES.WORKER) {
      if (!d.phone) need('phone', 'Workers must give a mobile number')
      if (!d.cooperativeId) need('cooperativeId', 'Choose your cooperative')
      if (!d.shramikCardNumber) need('shramikCardNumber', 'Enter your Shramik card number')
      if (!d.serviceIds) need('serviceIds', 'Choose at least one skill')
      if (!d.areas) need('areas', 'Choose at least one area')
    } else {
      for (const f of ['cooperativeId', 'shramikCardNumber', 'serviceIds', 'areas']) {
        if (d[f] !== undefined) need(f, 'Only workers give this')
      }
    }
  })

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1, 'Password is required').max(128),
    door: z.enum(DOORS).optional(), // which sign-in page the person used
  })
  .strict()

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1).max(128), newPassword: password })
  .strict()
  .refine((d) => d.currentPassword !== d.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current one',
  })

const linkToken = z.string().min(20).max(100)
export const checkTokenSchema = z.object({ token: linkToken }).strict()
export const setPasswordSchema = z.object({ token: linkToken, password }).strict()
export const forgotPasswordSchema = z.object({ email }).strict()
