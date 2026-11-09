import { z } from 'zod'

export const listNotificationsQuery = z
  .object({ unread: z.enum(['1', 'true']).optional(), limit: z.coerce.number().int().min(1).max(50).default(20) })
  .strict()

export const notificationIdParams = z.object({ id: z.string().regex(/^\d{1,18}$/, 'Invalid id') }).strict()
