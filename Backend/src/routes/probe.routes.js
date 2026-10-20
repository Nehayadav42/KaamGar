import { Router } from 'express'
import { ROLES } from '../constants/roles.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'

// TEMPORARY test endpoints so you can check role separation in Postman.
// They are only mounted when NODE_ENV is not "production". Delete them once real routes exist.
const router = Router()
const probe = (role) => (req, res) => res.json({ success: true, data: { ok: true, allowedRole: role, yourRole: req.user.role } })

router.get('/customer', authenticate, authorize(ROLES.CUSTOMER), probe(ROLES.CUSTOMER))
router.get('/worker', authenticate, authorize(ROLES.WORKER), probe(ROLES.WORKER))
router.get('/coop-admin', authenticate, authorize(ROLES.COOP_ADMIN), probe(ROLES.COOP_ADMIN))
router.get('/platform-admin', authenticate, authorize(ROLES.PLATFORM_ADMIN), probe(ROLES.PLATFORM_ADMIN))

export default router
