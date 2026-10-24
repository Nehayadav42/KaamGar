import { z } from 'zod'
import { AREAS } from '../constants/areas.js'
import { uuid } from './common.js'

const noTags = /^[^<>]*$/

export const serviceBody = z
  .object({
    name: z.string().trim().min(3, 'Give the service a clear name').max(80).regex(noTags, 'Name contains invalid characters'),
    category: z.string().trim().min(2, 'Add a category').max(60).regex(noTags, 'Category contains invalid characters'),
    description: z.string().trim().max(500).regex(noTags, 'Description contains invalid characters').default(''),
    areas: z.array(z.enum(AREAS)).max(AREAS.length).transform((a) => [...new Set(a)]).default([]),
    requires: z.object({ details: z.boolean(), address: z.boolean(), schedule: z.boolean() }).strict(),
    evidence: z.object({ before: z.boolean(), after: z.boolean(), notes: z.boolean() }).strict(),
  })
  .strict()

export const serviceIdParams = z.object({ id: uuid }).strict()

export const workerProfileBody = z
  .object({
    serviceIds: z.array(uuid).max(20).transform((a) => [...new Set(a)]),
    areas: z.array(z.enum(AREAS)).max(AREAS.length).transform((a) => [...new Set(a)]),
    availability: z.string().trim().min(1).max(60).regex(noTags),
    note: z.string().trim().max(120).regex(noTags).nullable().optional(),
    verified: z.boolean(),
  })
  .strict()
