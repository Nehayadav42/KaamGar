import { Router } from 'express'
import * as ctrl from '../controllers/bookings.controller.js'
import { ROLES } from '../constants/roles.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { createLimiter } from '../middleware/rateLimiters.js'
import { validate } from '../middleware/validate.js'
import { bookingIdParams, confirmBookingSchema, createBookingSchema, listBookingsQuery } from '../validators/booking.schemas.js'

const router = Router()
router.use(authenticate)

// Customers create and list their own bookings
router.post('/', authorize(ROLES.CUSTOMER), createLimiter, validate({ body: createBookingSchema }), ctrl.createBooking)
router.get('/', authorize(ROLES.CUSTOMER), validate({ query: listBookingsQuery }), ctrl.listMine)

// Anyone may ask for one booking, but the query only finds it if it is theirs to see
router.get('/:id', validate({ params: bookingIdParams }), ctrl.getBooking)
router.post('/:id/confirm', authorize(ROLES.CUSTOMER), validate({ params: bookingIdParams, body: confirmBookingSchema }), ctrl.confirmCompletion)

export default router
