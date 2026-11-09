import { pool } from '../db/pool.js'

// Numbers for the platform admin's overview
export async function platformOverview() {
  const [people, coops, bookings] = await Promise.all([
    pool.query(
      `SELECT
         count(*) FILTER (WHERE role = 'coop_admin' AND NOT invite_pending AND status = 'active')::int AS admins_active,
         count(*) FILTER (WHERE role = 'coop_admin' AND invite_pending)::int AS admins_invited,
         count(*) FILTER (WHERE role = 'worker' AND status = 'active')::int AS workers_active,
         count(*) FILTER (WHERE role = 'worker' AND status = 'pending')::int AS workers_pending,
         count(*) FILTER (WHERE role = 'customer')::int AS customers
       FROM users`,
    ),
    pool.query('SELECT count(*)::int AS n FROM cooperatives WHERE active'),
    pool.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE status = 'PENDING')::int AS pending,
              count(*) FILTER (WHERE status = 'COMPLETED')::int AS completed
       FROM bookings`,
    ),
  ])
  const p = people.rows[0]
  return {
    cooperatives: coops.rows[0].n,
    coopAdmins: { active: p.admins_active, invited: p.admins_invited },
    workers: { active: p.workers_active, pending: p.workers_pending },
    customers: p.customers,
    bookings: bookings.rows[0],
  }
}
