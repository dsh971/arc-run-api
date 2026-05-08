import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'

export class AuthController {
  private authService = new AuthService()

  checkUsername = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.body as { username: string }
      const available = await this.authService.isUsernameAvailable(username)
      res.json({ available })
    } catch (err) {
      next(err)
    }
  }

  setUsername = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      const { username } = req.body as { username: string }
      await this.authService.setUsername(req.user.id, username)
      res.status(200).json({ success: true })
    } catch (err) {
      next(err)
    }
  }
}
