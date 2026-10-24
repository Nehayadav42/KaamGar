import { z } from 'zod'
import { BOOKING_STATUSES } from '../constants/roles.js'
import { isRealDate } from '../utils/dates.js'
import { pagination, phone, uuid } from './common.js'

export const createBookingSchema = z
  .object({
    serviceId: uuid,
    details: z.string().trim().min(5, 'Please describe the job in a few words').max(1000).regex(/^[^<>]*$/, 'Details contain invalid characters').optional(),
    address: z.string().trim().min(6, 'Please add the full address, including your area').max(300).regex(/^[^<>]*$/, 'Address contains invalid characters').optional(),
    date: z.string().refine(isRealDate, 'Use a real date as YYYY-MM-DD').optional(),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a time as HH:MM').optional(),
    contact: phone,
  })
  .strict()

export const confirmBookingSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().trim().max(500).regex(/^[^<>]*$/, 'Comment contains invalid characters').optional(),
  })
  .strict()

export const bookingIdParams = z.object({ id: uuid }).strict()

export const listBookingsQuery = z
  .object({ status: z.enum(BOOKING_STATUSES).optional(), ...pagination })
  .strict()

export const allocateSchema = z.object({ workerId: uuid }).strict()
