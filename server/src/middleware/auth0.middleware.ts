import { auth } from 'express-oauth2-jwt-bearer'
import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

let _jwtCheck: ReturnType<typeof auth> | null = null

function getJwtCheck() {
  if (!_jwtCheck) {
    _jwtCheck = auth({
      audience: process.env.AUTH0_AUDIENCE,
      issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
      tokenSigningAlg: 'RS256',
    })
  }
  return _jwtCheck
}

export const jwtCheck = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7)
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret')
      req.auth = { header: {}, payload: decoded as Record<string, unknown>, token }
      next()
      return
    } catch {
      // Not a local JWT, continue to Auth0 validation
    }
  }
  getJwtCheck()(req, res, next)
}
