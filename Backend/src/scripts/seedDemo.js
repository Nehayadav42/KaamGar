import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { AREAS } from '../constants/areas.js'
import { ROLES, USER_STATUS } from '../constants/roles.js'
import { closePool } from '../db/pool.js'
import * as cooperatives from '../repositories/cooperatives.js'
import * as services from '../repositories/services.js'
import * as users from '../repositories/users.js'
import * as workers from '../repositories/workers.js'

// DEVELOPMENT ONLY: adds six sample workers and one coop admin so the admin screens have something to show.
//   npm run seed:demo        (run `npm run seed` first)
// Every demo account uses the password from DEMO_PASSWORD (default below). Never run this in production.
if (env.isProd) {
  console.error('seed:demo refuses to run when NODE_ENV=production')
  process.exit(1)
}
const PASSWORD = process.env.DEMO_PASSWORD || 'DemoPassw0rd!'
const coop = await cooperatives.findDefault()
if (!coop) { console.error('Run `npm run seed` first'); process.exit(1) }
const byName = Object.fromEntries((await services.list({ cooperativeId: coop.id })).map((s) => [s.name, s.id]))
const hash = await bcrypt.hash(PASSWORD, 12)

const people = [
  { name: 'Imran K.', email: 'imran@demo.kaamgar.test', skills: ['Plumbing repair'], areas: ['Arera Colony', 'MP Nagar'], availability: 'Available', status: USER_STATUS.ACTIVE, verified: true },
  { name: 'Sunita R.', email: 'sunita@demo.kaamgar.test', skills: ['Cleaning and maintenance'], areas: AREAS, availability: 'Available', status: USER_STATUS.ACTIVE, verified: true },
  { name: 'Rajesh V.', email: 'rajesh@demo.kaamgar.test', skills: ['Electrical repair'], areas: AREAS, availability: 'Available', status: USER_STATUS.ACTIVE, verified: true },
  { name: 'Farhan A.', email: 'farhan@demo.kaamgar.test', skills: ['Plumbing repair'], areas: AREAS, availability: 'Available except Saturday', status: USER_STATUS.ACTIVE, verified: true },
  { name: 'Meena P.', email: 'meena@demo.kaamgar.test', skills: ['Cleaning and maintenance', 'Plumbing repair'], areas: ['Kolar Road'], availability: 'Available', status: USER_STATUS.PENDING, verified: false },
  { name: 'Deepak M.', email: 'deepak@demo.kaamgar.test', skills: ['Electrical repair'], areas: ['MP Nagar'], availability: 'Unavailable', note: 'On leave this week', status: USER_STATUS.SUSPENDED, verified: true },
]

for (const p of people) {
  if (await users.emailExists(p.email)) { console.log(`exists: ${p.email}`); continue }
  const row = await users.create({ name: p.name, email: p.email, role: ROLES.WORKER, status: p.status, cooperativeId: coop.id, passwordHash: hash })
  await workers.createEmptyProfile(row.id)
  await workers.upsertProfile(row.id, {
    serviceIds: p.skills.map((s) => byName[s]).filter(Boolean),
    areas: p.areas,
    availability: p.availability,
    note: p.note ?? null,
    verified: p.verified,
  })
  console.log(`created worker: ${p.email}`)
}

const adminEmail = 'ayesha@demo.kaamgar.test'
if (!(await users.emailExists(adminEmail))) {
  await users.create({ name: 'Ayesha S.', email: adminEmail, role: ROLES.COOP_ADMIN, status: USER_STATUS.ACTIVE, cooperativeId: coop.id, passwordHash: hash })
  console.log(`created cooperative admin: ${adminEmail}`)
}
console.log(`\nDemo password for all of them: ${PASSWORD}`)
await closePool()
