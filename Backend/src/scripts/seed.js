import bcrypt from 'bcryptjs'
import { env } from '../config/env.js'
import { ROLES, USER_STATUS } from '../constants/roles.js'
import { closePool } from '../db/pool.js'
import * as cooperatives from '../repositories/cooperatives.js'
import * as users from '../repositories/users.js'
import { password as passwordRule } from '../validators/common.js'

// Creates the first Platform Admin and the demo cooperative. Safe to run more than once.
//   npm run seed
if (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD) {
  console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env first')
  process.exit(1)
}
// Same password rules as the API. (If a # in your password is being cut off, wrap the value in quotes in .env)
const pwCheck = passwordRule.safeParse(env.SEED_ADMIN_PASSWORD)
if (!pwCheck.success) {
  console.error(`SEED_ADMIN_PASSWORD is not strong enough: ${pwCheck.error.issues[0].message}`)
  console.error('Tip: if it contains #, wrap the value in "double quotes" in your .env file.')
  process.exit(1)
}

let admin = await users.findByEmail(env.SEED_ADMIN_EMAIL)
if (admin) {
  console.log(`Platform admin already exists: ${admin.email}`)
} else {
  admin = await users.create({
    name: env.SEED_ADMIN_NAME,
    email: env.SEED_ADMIN_EMAIL.toLowerCase(),
    role: ROLES.PLATFORM_ADMIN,
    status: USER_STATUS.ACTIVE,
    passwordHash: await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12),
  })
  console.log(`Created platform admin: ${admin.email}`)
}

const name = 'Bhopal Shramik Cooperative'
if (await cooperatives.findByName(name)) {
  console.log(`Cooperative already exists: ${name}`)
} else {
  await cooperatives.create({ name, area: 'Bhopal', createdBy: admin.id })
  console.log(`Created cooperative: ${name}`)
}

await closePool()
