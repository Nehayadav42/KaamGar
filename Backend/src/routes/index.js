import { Router } from 'express'
import { env } from '../config/env.js'
import { listPublicCooperatives } from '../controllers/admin.controller.js'
import authRoutes from './auth.routes.js'
import adminRoutes from './admin.routes.js'
import bookingRoutes from './bookings.routes.js'
import notificationRoutes from './notifications.routes.js'
import serviceRoutes from './services.routes.js'
import workerRoutes from './worker.routes.js'
import { listForSignup } from '../controllers/services.controller.js'
import { validate } from '../middleware/validate.js'
import { serviceIdParams } from '../validators/service.schemas.js'
import probeRoutes from './probe.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.get('/cooperatives', listPublicCooperatives) // public list for worker sign-up
router.get('/cooperatives/:id/services', validate({ params: serviceIdParams }), listForSignup) // public: skills to choose from
router.use('/services', serviceRoutes)
router.use('/notifications', notificationRoutes)
router.use('/worker', workerRoutes)
router.use('/bookings', bookingRoutes)
router.use('/admin', adminRoutes)
if (!env.isProd) router.use('/probe', probeRoutes)

export default router
