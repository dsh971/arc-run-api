import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { authenticate } from '../middleware/auth'
import { AuthController } from '../controllers/auth.controller'

const router = Router()
const authController = new AuthController()

const usernameBodySchema = z.object({
  username: z
    .string()
    .min(3, 'Call sign too short — minimum 3 characters')
    .max(20, 'Call sign too long — maximum 20 characters')
    .regex(/^[a-zA-Z0-9_]{3,20}$/, 'Letters, numbers, and underscores only'),
})

// Protected — fetch current user's profile
router.get('/profile',         authenticate, authController.getProfile)

// Protected — set username (no uniqueness check — display name only)
router.post('/username/set',   authenticate, validate(usernameBodySchema), authController.setUsername)

// Protected — age declaration (STORY-058, GDPR Article 8)
router.post('/age-declaration', authenticate, authController.confirmAgeDeclaration)

// Protected — Health & Safety Briefing + ToS acceptance (STORY-059)
router.post('/health-briefing', authenticate, authController.confirmHealthBriefing)

export default router
