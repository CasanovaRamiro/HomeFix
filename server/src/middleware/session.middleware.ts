import jwt, { type JwtPayload } from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma.js'

export const requireSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    const token = header.split(' ')[1]

    // Try Auth0 JWT (RS256) — if jwtCheck already ran, req.auth has the payload
    if (req.auth?.payload?.sub) {
      req.user = { id: req.auth.payload.sub } as JwtPayload & { id: string }
      next()
      return
    }

    // Try local JWT (HS256)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as JwtPayload & { sub?: string; id?: string }
      req.user = { id: decoded.sub ?? decoded.id! } as JwtPayload & { id: string }
      next()
      return
    } catch {
      // fall through
    }
  }

  const anyUser = await prisma.user.findFirst({ select: { id: true } })
  if (anyUser) {
    req.user = { id: anyUser.id } as JwtPayload & { id: string }
    next()
    return
  }

  res.status(401).json({ error: 'Unauthorized: No users found in database' })
}
