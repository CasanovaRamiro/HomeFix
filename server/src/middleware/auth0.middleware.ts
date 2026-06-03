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

interface CachedUserInfo {
  email?: string
  name?: string
  nickname?: string
  expiresAt: number
}

// Cache userinfo by sub to avoid hitting Auth0's /userinfo rate limit on every request
const userinfoCache = new Map<string, CachedUserInfo>()
const CACHE_TTL_MS = 5 * 60 * 1000

export const jwtCheck = (req: Request, res: Response, next: NextFunction): void => {
  getJwtCheck()(req, res, async () => {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) {
      const sub = req.auth?.payload?.sub as string | undefined

      if (sub) {
        const cached = userinfoCache.get(sub)
        if (cached && Date.now() < cached.expiresAt) {
          if (req.auth?.payload) {
            if (cached.email) req.auth.payload['email'] = cached.email
            if (cached.name) req.auth.payload['name'] = cached.name
            if (cached.nickname) req.auth.payload['nickname'] = cached.nickname
          }
        } else {
          try {
            const token = header.split(' ')[1]
            const issuer = (process.env.AUTH0_ISSUER_BASE_URL || '').replace(/\/$/, '')
            const resp = await fetch(`${issuer}/userinfo`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (resp.ok) {
              const userinfo = await resp.json() as { email?: string; name?: string; nickname?: string }
              const entry: CachedUserInfo = {
                email: userinfo.email,
                name: userinfo.name,
                nickname: userinfo.nickname,
                expiresAt: Date.now() + CACHE_TTL_MS,
              }
              userinfoCache.set(sub, entry)
              if (req.auth?.payload) {
                if (userinfo.email) req.auth.payload['email'] = userinfo.email
                if (userinfo.name) req.auth.payload['name'] = userinfo.name
                if (userinfo.nickname) req.auth.payload['nickname'] = userinfo.nickname
              }
            }
          } catch {
            // continue without userinfo
          }
        }
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
