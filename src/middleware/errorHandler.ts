import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../types'

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500
  const message = statusCode === 500 ? 'Internal server error' : err.message

  if (statusCode === 500) {
    console.error('[arc-run-api] Unhandled error:', err)
  }

  res.status(statusCode).json({ error: message })
}
