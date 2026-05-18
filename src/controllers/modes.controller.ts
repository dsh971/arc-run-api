import { Request, Response, NextFunction } from 'express'
import { ModesService } from '../services/modes.service'

const modesService = new ModesService()

export class ModesController {
  getModes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [modes, version] = await Promise.all([
        modesService.getActiveModes(),
        modesService.getVersion(),
      ])
      res.setHeader('ETag', `"${version}"`)
      res.setHeader('Cache-Control', 'public, max-age=86400') // 24h
      res.json({ modes, version })
    } catch (err) {
      next(err)
    }
  }

  getVersion = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const version = await modesService.getVersion()
      res.json({ version })
    } catch (err) {
      next(err)
    }
  }
}
