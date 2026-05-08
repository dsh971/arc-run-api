export interface AuthenticatedUser {
  id: string
  email: string
}

export interface ApiError extends Error {
  statusCode?: number
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}
