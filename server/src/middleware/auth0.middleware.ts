import { auth } from 'express-oauth2-jwt-bearer'
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
  getJwtCheck()(req, res, next)
}