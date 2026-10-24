import { Router } from 'express'
import { listCatalogue } from '../controllers/services.controller.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()
router.get('/', authenticate, listCatalogue) // any logged-in user sees the active catalogue
export default router
