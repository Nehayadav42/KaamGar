import { Router } from 'express'
import * as ctrl from '../controllers/notifications.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate } from '../middleware/validate.js'
import { listNotificationsQuery, notificationIdParams } from '../validators/notification.schemas.js'

const router = Router()
router.use(authenticate) // any signed-in person, but only ever their own notifications

router.get('/', validate({ query: listNotificationsQuery }), ctrl.list)
router.post('/read-all', ctrl.markAllRead)
router.post('/:id/read', validate({ params: notificationIdParams }), ctrl.markRead)

export default router
