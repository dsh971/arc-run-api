import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { RunsController } from '../controllers/runs.controller'

const router = Router()
const runsController = new RunsController()

const runSchema = z.object({
  id:              z.string().uuid(),
  started_at:      z.string().datetime(),
  ended_at:        z.string().datetime(),
  distance_miles:  z.number().min(0),
  duration_secs:   z.number().int().min(0),
  avg_pace_secs:   z.number().int().min(1),
  difficulty_slug: z.string().min(1),
  caught_flag:     z.boolean(),
  outcome:         z.enum(['survived', 'caught']),
})

// Protected — save a completed run (idempotent via upsert)
router.post('/', authenticate, validate(runSchema), runsController.saveRun)

export default router
