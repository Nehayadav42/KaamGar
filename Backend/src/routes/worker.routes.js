import { Router } from 'express'
import * as ctrl from '../controllers/worker.controller.js'
import { ROLES } from '../constants/roles.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize, requireActive } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
import { bookingIdParams, declineJobSchema, listBookingsQuery } from '../validators/booking.schemas.js'

const router = Router()
router.use(authenticate, authorize(ROLES.WORKER))

// A worker can always see their own details and review state, even before approval
router.get('/profile', ctrl.getProfile)

// Everything else only for workers whose cooperative has approved them
router.use(requireActive)

router.get('/jobs', validate({ query: listBookingsQuery }), ctrl.listJobs)
router.get('/jobs/:id', validate({ params: bookingIdParams }), ctrl.getJob)
router.post('/jobs/:id/accept', validate({ params: bookingIdParams }), ctrl.accept)
router.post('/jobs/:id/start', validate({ params: bookingIdParams }), ctrl.start)
router.post('/jobs/:id/finish', validate({ params: bookingIdParams }), ctrl.finish)
router.post('/jobs/:id/decline', validate({ params: bookingIdParams, body: declineJobSchema }), ctrl.decline)

export default router
