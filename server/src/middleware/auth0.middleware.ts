import { auth } from 'express-oauth2-jwt-bearer'
import jwt, { type JwtPayload } from 'jsonwebtoken'
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
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const token = header.split(' ')[1]

  // Try local JWT first (fails fast for Auth0 tokens, succeeds for local auth fallback)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as JwtPayload & {
      sub?: string
      email?: string
      name?: string
    }
    if (decoded.sub) {
      ;(req as unknown as Record<string, unknown>).auth = {
        payload: { sub: decoded.sub, email: decoded.email, name: decoded.name },
      }
      next()
      return
    }
  } catch {
    // Not a local JWT, fall through to Auth0
  }

  getJwtCheck()(req, res, async () => {
    try {
      const issuer = (process.env.AUTH0_ISSUER_BASE_URL || '').replace(/\/$/, '')
      const resp = await fetch(`${issuer}/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (resp.ok) {
        const userinfo = (await resp.json()) as { email?: string }
        if (userinfo.email && req.auth?.payload) {
          req.auth.payload['email'] = userinfo.email
        }
      }
    } catch {
      // continue without email
    }
    next()
  })
}
