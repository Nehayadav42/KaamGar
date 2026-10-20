import { Router } from 'express'
import * as ctrl from '../controllers/admin.controller.js'
import { ROLES } from '../constants/roles.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
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

export default router
