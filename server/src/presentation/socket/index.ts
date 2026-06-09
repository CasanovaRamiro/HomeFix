import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { registerChatHandlers } from './chat.handler.js'
import { syncAuth0User, type Auth0Claims } from '../../domain/services/auth.service.js'
import { env } from '../../lib/envConfig.js'

let io: Server | null = null

interface CachedUserInfo {
  email?: string
  name?: string
  nickname?: string
  expiresAt: number
}

const userinfoCache = new Map<string, CachedUserInfo>()
const CACHE_TTL_MS = 5 * 60 * 1000

export const getIO = (): Server | null => {
  return io
}

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: { origin: '*' },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
    },
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) return next(new Error('Authentication required'))

    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8')) as Record<string, unknown>
      const sub = payload?.sub as string | undefined

      if (sub) {
        const cached = userinfoCache.get(sub)
        if (cached && Date.now() < cached.expiresAt) {
          payload['email'] ??= cached.email
          payload['name'] ??= cached.name
          payload['nickname'] ??= cached.nickname
        } else {
          try {
            const issuer = env.AUTH0_ISSUER_BASE_URL.replace(/\/$/, '')
            const resp = await fetch(`${issuer}/userinfo`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (resp.ok) {
              const userinfo = (await resp.json()) as { email?: string; name?: string; nickname?: string }
              const entry: CachedUserInfo = {
                email: userinfo.email,
                name: userinfo.name,
                nickname: userinfo.nickname,
                expiresAt: Date.now() + CACHE_TTL_MS,
              }
              userinfoCache.set(sub, entry)
              payload['email'] ??= userinfo.email
              payload['name'] ??= userinfo.name
              payload['nickname'] ??= userinfo.nickname
            }
          } catch {
            // continue without userinfo enrichment
          }
        }
      }

      const user = await syncAuth0User(payload as unknown as Auth0Claims)
      socket.data.user = { id: user.id, name: user.name }
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  registerChatHandlers(io)
  return io
}
