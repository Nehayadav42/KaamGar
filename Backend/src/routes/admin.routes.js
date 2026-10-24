import { Router } from 'express'
import * as ctrl from '../controllers/admin.controller.js'
import * as ops from '../controllers/adminOps.controller.js'
import * as svc from '../controllers/services.controller.js'
import { ROLES } from '../constants/roles.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
import { allocateSchema, bookingIdParams, listBookingsQuery } from '../validators/booking.schemas.js'
import { serviceBody, serviceIdParams, workerProfileBody } from '../validators/service.schemas.js'
import {
  auditQuery,
  createCoopAdminSchema,
  createCooperativeSchema,
  idParams,
  listUsersQuery,
  updateStatusSchema,
} from '../validators/admin.schemas.js'

const router = Router()
const { PLATFORM_ADMIN, COOP_ADMIN } = ROLES

// Everything below needs a valid login
router.use(authenticate)

// Platform admin only
router.post('/cooperatives', authorize(PLATFORM_ADMIN), validate({ body: createCooperativeSchema }), ctrl.createCooperative)
router.get('/cooperatives', authorize(PLATFORM_ADMIN), ctrl.listCooperatives)
router.post('/coop-admins', authorize(PLATFORM_ADMIN), validate({ body: createCoopAdminSchema }), ctrl.createCoopAdmin)
router.get('/audit-logs', authorize(PLATFORM_ADMIN), validate({ query: auditQuery }), ctrl.listAuditLogs)

// Platform admin (everyone) and cooperative admin (own workers only, enforced in the controller)
router.get('/users', authorize(PLATFORM_ADMIN, COOP_ADMIN), validate({ query: listUsersQuery }), ctrl.listUsers)
router.patch(
  '/users/:id/status',
  authorize(PLATFORM_ADMIN, COOP_ADMIN),
  validate({ params: idParams, body: updateStatusSchema }),
  ctrl.updateUserStatus,
)

// ── Cooperative operations (cooperative admin: own cooperative only. platform admin: everything) ──
const staff = authorize(PLATFORM_ADMIN, COOP_ADMIN)

router.get('/overview', staff, ops.overview)

router.get('/bookings', staff, validate({ query: listBookingsQuery }), ops.listBookings)
router.get('/bookings/:id/eligible-workers', staff, validate({ params: bookingIdParams }), ops.eligibleWorkers)
router.post('/bookings/:id/allocate', staff, validate({ params: bookingIdParams, body: allocateSchema }), ops.allocate)
router.post('/bookings/:id/advance', staff, validate({ params: bookingIdParams }), ops.advance)

router.get('/workers', staff, ops.listWorkers)
router.patch('/workers/:id/profile', staff, validate({ params: serviceIdParams, body: workerProfileBody }), ops.updateWorkerProfile)

router.get('/services', staff, svc.listAdmin)
router.post('/services', staff, validate({ body: serviceBody }), svc.createService)
router.get('/services/:id', staff, validate({ params: serviceIdParams }), svc.getAdmin)
router.patch('/services/:id', staff, validate({ params: serviceIdParams, body: serviceBody }), svc.updateService)
router.post('/services/:id/activate', staff, validate({ params: serviceIdParams }), svc.activateService)
router.post('/services/:id/deactivate', staff, validate({ params: serviceIdParams }), svc.deactivateService)

export default router
