import { Router } from 'express'
import { env } from '../config/env.js'
import { listPublicCooperatives } from '../controllers/admin.controller.js'
import authRoutes from './auth.routes.js'
import adminRoutes from './admin.routes.js'
import bookingRoutes from './bookings.routes.js'
import serviceRoutes from './services.routes.js'
import probeRoutes from './probe.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.get('/cooperatives', listPublicCooperatives) // public list for worker sign-up
router.use('/services', serviceRoutes)
router.use('/bookings', bookingRoutes)
router.use('/admin', adminRoutes)
if (!env.isProd) router.use('/probe', probeRoutes)

export default router
