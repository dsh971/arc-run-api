import { Request, Response, NextFunction } from 'express'
import { RunsService } from '../services/runs.service'
import { requireUser } from '../middleware/auth'

const runsService = new RunsService()

export class RunsController {
  saveRun = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!requireUser(req, res)) return
      await runsService.saveRun(req.user.id, req.body)
      res.status(201).json({ success: true })
    } catch (err) { next(err) }
  }
}
