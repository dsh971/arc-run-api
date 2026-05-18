import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { requireUser } from '../middleware/auth'

// Bump this value when the Health & Safety Briefing / ToS text changes to force re-acceptance
const CURRENT_TOS_VERSION = 'v0.1'

export class AuthController {
  private authService = new AuthService()

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!requireUser(req, res)) return
      res.json(await this.authService.getProfile(req.user.id))
    } catch (err) { next(err) }
  }

  setUsername = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!requireUser(req, res)) return
      const { username } = req.body as { username: string }
      await this.authService.setUsername(req.user.id, username)
      res.json({ success: true })
    } catch (err) { next(err) }
  }

  confirmAgeDeclaration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!requireUser(req, res)) return
      await this.authService.confirmAgeDeclaration(req.user.id)
      res.json({ success: true })
    } catch (err) { next(err) }
  }

  confirmHealthBriefing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!requireUser(req, res)) return
      await this.authService.confirmHealthBriefing(req.user.id, CURRENT_TOS_VERSION)
      res.json({ success: true })
    } catch (err) { next(err) }
  }
}
