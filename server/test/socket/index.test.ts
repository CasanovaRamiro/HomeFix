import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Server as HttpServer } from 'http'

const mockIo = vi.hoisted(() => ({ use: vi.fn(), on: vi.fn() }))

vi.mock('socket.io', () => {
  function MockServer() { return mockIo }
  MockServer.prototype = Object.create(null)
  return { Server: MockServer as unknown as typeof import('socket.io').Server }
})

vi.mock('../../src/presentation/socket/chat.handler.js', () => ({
  registerChatHandlers: vi.fn(),
}))

vi.mock('../../src/domain/services/auth.service.js', () => ({
  syncAuth0User: vi.fn(),
}))

import { initSocket } from '../../src/presentation/socket/index.js'
import { syncAuth0User } from '../../src/domain/services/auth.service.js'

const b64url = (obj: Record<string, unknown>) =>
  Buffer.from(JSON.stringify(obj)).toString('base64url')

const createToken = (claims: Record<string, unknown>) => {
  const header = b64url({ alg: 'HS256', typ: 'JWT' })
  const payload = b64url(claims)
  return `${header}.${payload}.fake-signature`
}

const mockHttpServer = {} as HttpServer

interface MockSocket {
  handshake: { auth: Record<string, unknown> }
  data: Record<string, unknown>
}

describe('initSocket middleware', () => {
  let middleware: (socket: MockSocket, next: (err?: unknown) => void) => Promise<void>

  beforeEach(() => {
    vi.clearAllMocks()
    initSocket(mockHttpServer)
    middleware = mockIo.use.mock.calls[0][0]
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const makeSocket = (claims: Record<string, unknown> | null): MockSocket => ({
    handshake: { auth: claims ? { token: createToken(claims) } : {} },
    data: {},
  })

  it('should reject when token is missing', async () => {
    const socket = makeSocket(null)
    const next = vi.fn()

    await middleware(socket, next)

    expect(next).toHaveBeenCalledWith(new Error('Authentication required'))
    expect(syncAuth0User).not.toHaveBeenCalled()
  })

  it('should set socket.data.user and call next on valid token', async () => {
    vi.mocked(syncAuth0User).mockResolvedValue({ id: 'user-1', name: 'Test User' } as never)

    const socket = makeSocket({ sub: 'auth0|123', email: 'test@test.com', name: 'Test User' })
    const next = vi.fn()

    await middleware(socket, next)

    expect(syncAuth0User).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'auth0|123', email: 'test@test.com' }),
    )
    expect(socket.data.user).toEqual({ id: 'user-1', name: 'Test User' })
    expect(next).toHaveBeenCalledWith()
  })

  it('should fetch /userinfo when token lacks email', async () => {
    vi.mocked(syncAuth0User).mockResolvedValue({ id: 'user-2', name: 'Fetched' } as never)

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ email: 'fetched@test.com', name: 'Fetched Name', nickname: 'fetched_nick' }),
    } as Response)

    const socket = makeSocket({ sub: 'auth0|noemail' })
    const next = vi.fn()

    await middleware(socket, next)

    expect(syncAuth0User).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'auth0|noemail', email: 'fetched@test.com' }),
    )
    expect(fetchSpy).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('should use cache on second call for same sub', async () => {
    vi.mocked(syncAuth0User).mockResolvedValue({ id: 'user-3', name: 'Cached' } as never)

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ email: 'cached@test.com', name: 'Cached Name' }),
    } as Response)

    const socket1 = makeSocket({ sub: 'auth0|cacheduser' })
    await middleware(socket1, vi.fn())
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    fetchSpy.mockClear()
    const socket2 = makeSocket({ sub: 'auth0|cacheduser' })
    await middleware(socket2, vi.fn())
    expect(fetchSpy).not.toHaveBeenCalled()

    fetchSpy.mockRestore()
  })

  it('should continue without enrich when /userinfo fails', async () => {
    vi.mocked(syncAuth0User).mockResolvedValue({ id: 'user-4', name: 'Fallback' } as never)

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
    } as Response)

    const socket = makeSocket({ sub: 'auth0|failemail' })
    const next = vi.fn()

    await middleware(socket, next)

    expect(syncAuth0User).toHaveBeenCalledWith(
      expect.not.objectContaining({ email: expect.any(String) }),
    )
    expect(next).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('should call next with error when token is invalid', async () => {
    const socket = { handshake: { auth: { token: 'invalid-token' } }, data: {} }
    const next = vi.fn()

    await middleware(socket, next)

    expect(next).toHaveBeenCalledWith(new Error('Invalid token'))
    expect(syncAuth0User).not.toHaveBeenCalled()
  })

  it('should enrich with name and nickname from userinfo', async () => {
    vi.mocked(syncAuth0User).mockResolvedValue({ id: 'user-5', name: 'Enriched' } as never)

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ email: 'enriched@test.com', name: 'Enriched Name', nickname: 'enriched_nick' }),
    } as Response)

    const socket = makeSocket({ sub: 'auth0|enrich' })
    const next = vi.fn()

    await middleware(socket, next)

    expect(syncAuth0User).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'auth0|enrich',
        email: 'enriched@test.com',
        name: 'Enriched Name',
        nickname: 'enriched_nick',
      }),
    )
    fetchSpy.mockRestore()
  })
})
