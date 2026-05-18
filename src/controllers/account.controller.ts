import { Request, Response, NextFunction } from 'express'
import { AccountService } from '../services/account.service'
import { requireUser } from '../middleware/auth'

const accountService = new AccountService()

export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!requireUser(req, res)) return
    await accountService.deleteAccount(req.user.id)
    res.status(200).json({ message: 'Account deleted' })
  } catch (err) {
    next(err)
  }
}
