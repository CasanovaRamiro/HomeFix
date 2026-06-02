import { auth } from 'express-oauth2-jwt-bearer'
import type { Request, Response, NextFunction } from 'express'

export const ROLES_CLAIM = 'https://homefix/roles'

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
          if (req.auth?.payload) {
            if (userinfo.email) req.auth.payload['email'] = userinfo.email
          }
        }
      } catch {
        // continue without email
      }

      // Alias the namespaced role claim to a convenient key
      if (req.auth?.payload) {
        const role = req.auth.payload[ROLES_CLAIM]
        if (typeof role === 'string') {
          req.auth.payload['role'] = role
        }
      }
    }
    next()
  })
}
