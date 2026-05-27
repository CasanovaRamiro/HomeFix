import jwt, { type JwtPayload } from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import prisma from '../lib/prisma.js'

const DEV_TRABAJADOR_ID = '502181f0-e875-49b1-b9a6-dbdd2d99eb18'

export const requireSession = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET!) as JwtPayload & { id: string }
      next()
      return
    } catch {
      // fall through
    }
  }
  if (!process.env.AUTH0_AUDIENCE || !process.env.AUTH0_ISSUER_BASE_URL) {
    const dev = await prisma.user.findFirst({ where: { role: 'trabajador' }, select: { id: true } })
    req.user = { id: dev?.id ?? DEV_TRABAJADOR_ID } as JwtPayload & { id: string }
  } else {
    req.user = { id: DEV_TRABAJADOR_ID } as JwtPayload & { id: string }
  }
  next()
}
