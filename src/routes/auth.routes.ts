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
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9_]{1,18}[a-zA-Z0-9]$/, 'Letters, numbers, and underscores only')
    .refine(val => !/__/.test(val), 'Consecutive underscores are not allowed'),
})

// Public — check availability before user commits to a username
router.post(
  '/username/check',
  validate(z.object({ username: z.string().min(1) })),
  authController.checkUsername
)

// Protected — set username after account creation
router.post(
  '/username/set',
  authenticate,
  validate(usernameBodySchema),
  authController.setUsername
)

export default router
