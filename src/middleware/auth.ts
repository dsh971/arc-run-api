import { Request, Response, NextFunction } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { env } from '../config/env'
import { AuthenticatedUser } from '../types'

// JWKS over a shared secret — Supabase rotates signing keys; JWKS allows key rollover without a redeploy
const JWKS = createRemoteJWKSet(
  new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
)

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${env.SUPABASE_URL}/auth/v1`,
    })

    req.user = {
      id: payload.sub as string,
      email: payload['email'] as string,
    }

    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Separate from `authenticate` because some routes are public — controllers opt in to the user guard explicitly
export function requireUser(
  req: Request,
  res: Response
): req is Request & { user: AuthenticatedUser } {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}
