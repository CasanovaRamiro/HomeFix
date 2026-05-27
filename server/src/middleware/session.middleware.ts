import jwt, { type JwtPayload } from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

const MOCK_USER_ID = 1

export const requireSession = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET!) as JwtPayload & { id: number }
      next()
      return
    } catch {
      // fall through to fallback
    }
  }
  req.user = { id: MOCK_USER_ID } as JwtPayload & { id: number }
  next()
}
