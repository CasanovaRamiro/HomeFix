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
  getJwtCheck()(req, res, async () => {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      try {
        const token = header.split(' ')[1]
        const issuer = (process.env.AUTH0_ISSUER_BASE_URL || '').replace(/\/$/, '')
        const resp = await fetch(`${issuer}/userinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (resp.ok) {
          const userinfo = await resp.json()
          // TODO: tech debt, add way to type req
          interface AuthedRequest extends Request {
            auth?: { payload: Record<string, unknown> }
          }
          const authedReq = req as AuthedRequest
          if (userinfo.email && authedReq.auth?.payload) {
            authedReq.auth.payload.email = userinfo.email
          }
        }
      } catch {
        // continue without email
      }
    }
    next()
  })
}
