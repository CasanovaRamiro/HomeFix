import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateKeyPairSync, sign, type KeyObject } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import express from 'express'
import request from 'supertest'
import { UserRole } from '../../src/domain/types/userRole.js'

const { testEnv } = vi.hoisted(() => ({
  testEnv: {
    AUTH0_AUDIENCE: 'https://homefix.test/api',
    AUTH0_ISSUER_BASE_URL: '',
    GEMINI_API_KEY: 'unused-test-key',
    GEMINI_MODEL: 'unused-test-model',
  },
}))

vi.mock('../../src/lib/envConfig.js', () => ({ env: testEnv }))
vi.mock('../../src/lib/logger.js', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

// Keep the real route registration, JWT middleware, verifier and error handler.
// Only downstream services are stubbed so these tests need no database or SaaS.
import { registerRoutes } from '../../src/presentation/routes/index.js'
import { errorHandler } from '../../src/presentation/middleware/error.middleware.js'
import { ROLES_CLAIM } from '../../src/presentation/middleware/auth0.middleware.js'
import * as userService from '../../src/domain/services/user.service.js'
import * as workerService from '../../src/domain/services/worker.service.js'
import * as authService from '../../src/domain/services/auth.service.js'
import * as dashboardService from '../../src/domain/services/workerDashboard.service.js'
import * as aiService from '../../src/domain/services/ai.service.js'
import * as cloudinaryProvider from '../../src/infrastructure/providers/cloudinary.provider.js'

const app = express()
app.use(express.json())
registerRoutes(app)
app.use(errorHandler)

let issuerServer: Server
let privateKey: KeyObject
let otherPrivateKey: KeyObject
let userinfoRequests = 0

function token(claims: Record<string, unknown> = {}, key = privateKey): string {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test-key' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss: testEnv.AUTH0_ISSUER_BASE_URL,
    aud: testEnv.AUTH0_AUDIENCE,
    sub: 'auth0|client-1',
    iat: now,
    exp: now + 300,
    ...claims,
  })).toString('base64url')
  const input = `${header}.${payload}`
  return `${input}.${sign('RSA-SHA256', Buffer.from(input), key).toString('base64url')}`
}

beforeAll(async () => {
  const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 })
  privateKey = keyPair.privateKey
  otherPrivateKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey
  const publicJwk = keyPair.publicKey.export({ format: 'jwk' })

  issuerServer = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json')
    if (req.url === '/.well-known/openid-configuration') {
      res.end(JSON.stringify({
        issuer: testEnv.AUTH0_ISSUER_BASE_URL,
        jwks_uri: `${testEnv.AUTH0_ISSUER_BASE_URL}jwks`,
        id_token_signing_alg_values_supported: ['RS256'],
      }))
    } else if (req.url === '/jwks') {
      res.end(JSON.stringify({ keys: [{ ...publicJwk, kid: 'test-key', alg: 'RS256', use: 'sig' }] }))
    } else if (req.url === '/userinfo') {
      userinfoRequests++
      res.end(JSON.stringify({ email: 'test@homefix.test', name: 'Test User', nickname: 'test' }))
    } else {
      res.writeHead(404).end()
    }
  })
  await new Promise<void>((resolve) => issuerServer.listen(0, '127.0.0.1', resolve))
  const { port } = issuerServer.address() as AddressInfo
  testEnv.AUTH0_ISSUER_BASE_URL = `http://127.0.0.1:${port}/`
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    issuerServer.close((error) => error ? reject(error) : resolve())
    issuerServer.closeAllConnections()
  })
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.restoreAllMocks()
  userinfoRequests = 0
  vi.spyOn(userService, 'listUsers').mockResolvedValue([])
  vi.spyOn(workerService, 'listWorkers').mockResolvedValue([])
  vi.spyOn(aiService, 'suggestPost').mockResolvedValue({} as never)
  vi.spyOn(cloudinaryProvider, 'uploadImages').mockResolvedValue([])
  vi.spyOn(dashboardService, 'getWorkerDashboard').mockResolvedValue({} as never)
  vi.spyOn(userService, 'setRequiresStartToken').mockResolvedValue({ requiresStartToken: true } as never)
  vi.spyOn(authService, 'syncAuth0User').mockImplementation((claims) => Promise.resolve({
    id: claims?.sub?.replace('auth0|', ''),
    role: claims?.role ?? UserRole.Client,
  } as never))
})

const protectedRoutes = [
  { method: 'get', path: '/users' },
  { method: 'get', path: '/workers' },
  { method: 'get', path: '/posts' },
  { method: 'post', path: '/ai/suggest' },
  { method: 'get', path: '/applications/my-applications' },
  { method: 'get', path: '/worker-dashboard' },
  { method: 'get', path: '/reviews/application/test-application' },
  { method: 'post', path: '/upload' },
  { method: 'get', path: '/upload/download' },
  { method: 'get', path: '/telegram/status' },
  { method: 'get', path: '/client/stats' },
  { method: 'get', path: '/client-profiles/test-client' },
  { method: 'get', path: '/kyc/status' },
  { method: 'post', path: '/kyc/session' },
  { method: 'get', path: '/auth/me' },
] as const

describe.each([
  { name: 'missing token', authorization: () => undefined },
  { name: 'malformed token', authorization: () => 'Bearer not-a-jwt' },
  { name: 'expired token', authorization: () => `Bearer ${token({ exp: Math.floor(Date.now() / 1000) - 60 })}` },
  { name: 'wrong signature', authorization: () => `Bearer ${token({}, otherPrivateKey)}` },
  { name: 'wrong issuer', authorization: () => `Bearer ${token({ iss: 'https://untrusted.test/' })}` },
  { name: 'wrong audience', authorization: () => `Bearer ${token({ aud: 'https://other-api.test' })}` },
])('$name', ({ authorization }) => {
  it.each(protectedRoutes)('rejects $method $path before downstream work', async ({ method, path }) => {
    const req = request(app)[method](path)
    const header = authorization()
    if (header) req.set('Authorization', header)
    const res = await req.send({})

    expect(res.status).toBe(401)
    if (path === '/users') {
      expect(JSON.stringify(res.body)).not.toMatch(/test@homefix\.test|phone|email/i)
    }
    expect(userinfoRequests).toBe(0)
    expect(userService.listUsers).not.toHaveBeenCalled()
    expect(workerService.listWorkers).not.toHaveBeenCalled()
    expect(authService.syncAuth0User).not.toHaveBeenCalled()
    expect(aiService.suggestPost).not.toHaveBeenCalled()
    expect(cloudinaryProvider.uploadImages).not.toHaveBeenCalled()
  })
})

describe('valid JWTs', () => {
  it.each([UserRole.Client, UserRole.Worker])('denies GET /users to %s without exposing personal data', async (role) => {
    const res = await request(app).get('/users')
      .set('Authorization', `Bearer ${token({ sub: `auth0|${role}-1`, [ROLES_CLAIM]: role })}`)
      .set('x-role', 'admin')

    expect(res.status).toBe(403)
    expect(res.body).toEqual({ error: 'Forbidden' })
    expect(JSON.stringify(res.body)).not.toMatch(/test@homefix\.test|phone|email/i)
    expect(userService.listUsers).not.toHaveBeenCalled()
  })

  it('preserves authenticated worker listing', async () => {
    const res = await request(app).get('/workers').set('Authorization', `Bearer ${token()}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
    expect(workerService.listWorkers).toHaveBeenCalledOnce()
  })

  it('preserves authenticated GET /auth/me', async () => {
    const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token()}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ id: 'client-1', role: UserRole.Client })
    expect(authService.syncAuth0User).toHaveBeenCalledOnce()
  })

  it.each([
    { role: UserRole.Client, status: 403 },
    { role: UserRole.Worker, status: 200 },
  ])('preserves dashboard authorization for $role', async ({ role, status }) => {
    const res = await request(app).get('/worker-dashboard').set('Authorization', `Bearer ${token({
      sub: `auth0|${role}-1`, [ROLES_CLAIM]: role,
    })}`)

    expect(res.status).toBe(status)
    expect(authService.syncAuth0User).toHaveBeenCalledWith(expect.objectContaining({
      sub: `auth0|${role}-1`, role, email: 'test@homefix.test', name: 'Test User', nickname: 'test',
    }))
    if (role === UserRole.Worker) {
      expect(dashboardService.getWorkerDashboard).toHaveBeenCalledExactlyOnceWith('worker-1')
    } else {
      expect(dashboardService.getWorkerDashboard).not.toHaveBeenCalled()
    }
  })

  it.each([
    { id: 'client-1', status: 200 },
    { id: 'other-client', status: 403 },
  ])('preserves ownership checks for $id', async ({ id, status }) => {
    const res = await request(app).patch(`/users/${id}/start-token-setting`)
      .set('Authorization', `Bearer ${token()}`).send({ enabled: true })

    expect(res.status).toBe(status)
    if (status === 200) {
      expect(userService.setRequiresStartToken).toHaveBeenCalledExactlyOnceWith('client-1', true)
    } else {
      expect(userService.setRequiresStartToken).not.toHaveBeenCalled()
    }
  })
})

it('keeps health public', async () => {
  const res = await request(app).get('/health')
  expect(res.status).toBe(200)
  expect(res.body).toEqual({ status: 'ok' })
})
