import { Router } from 'express'
import * as ctrl from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authLimiter, emailLimiter, loginLimiter } from '../middleware/rateLimiters.js'
import { validate } from '../middleware/validate.js'
import { changePasswordSchema, checkTokenSchema, forgotPasswordSchema, loginSchema, registerSchema, setPasswordSchema } from '../validators/auth.schemas.js'

const router = Router()

router.post('/register', authLimiter, validate({ body: registerSchema }), ctrl.register)
router.post('/login', loginLimiter, validate({ body: loginSchema }), ctrl.login)
router.post('/refresh', authLimiter, ctrl.refresh)
router.post('/logout', ctrl.logout)
router.post('/logout-all', authenticate, ctrl.logoutAll)
router.get('/me', authenticate, ctrl.me)
router.patch('/change-password', authenticate, authLimiter, validate({ body: changePasswordSchema }), ctrl.changePassword)

// Emailed links
router.post('/setup-token/check', authLimiter, validate({ body: checkTokenSchema }), ctrl.checkSetupToken)
router.post('/set-password', authLimiter, validate({ body: setPasswordSchema }), ctrl.setPassword)
router.post('/forgot-password', emailLimiter, validate({ body: forgotPasswordSchema }), ctrl.forgotPassword)

export default router
