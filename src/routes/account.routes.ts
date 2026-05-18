import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { deleteAccount } from '../controllers/account.controller'

const router = Router()

// DELETE /v1/account — permanently deletes the authenticated user's account and all associated data
router.delete('/', authenticate, deleteAccount)

export default router
