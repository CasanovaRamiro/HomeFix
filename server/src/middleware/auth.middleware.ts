import jwt, { type JwtPayload } from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET!) as JwtPayload & { id: number }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
