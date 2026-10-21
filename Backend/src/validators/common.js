import { z } from 'zod'

export const uuid = z.string().uuid('Invalid id')

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254)

// At least 10 characters with a letter and a number. 72 is bcrypt's limit.
export const password = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number')

export const personName = z
  .string()
  .trim()
  .min(2, 'Name is too short')
  .max(80, 'Name is too long')
  .regex(/^[^<>]*$/, 'Name contains invalid characters')

// Indian mobile number, 10 digits
export const phone = z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a 10-digit mobile number')

export const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}
