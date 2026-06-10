import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { cleanDb } from '../helpers/db.js'

vi.mock('../../src/presentation/middleware/auth0.middleware.js', async () => {
  const mock = await import('../helpers/auth0Mock.js')
  return { jwtCheck: mock.jwtCheck }
})

import { app } from '../../src/index.js'

beforeEach(() => cleanDb())

beforeEach(() => {
  process.env.AUTH0_ISSUER_BASE_URL = 'https://tenant.example.com/'
  process.env.AUTH0_CLIENT_ID = 'client-id'
  process.env.AUTH0_DB_CONNECTION = 'Username-Password-Authentication'
})

describe('GET /auth/me', () => {
  it('returns 401 when token is missing', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns 200 and creates user when registering via Google', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer test-auth0-token')
      .set('x-auth-source', 'register')

    expect(res.status).toBe(200)
    expect(res.body.email).toBe('test@test.com')
    expect(res.body).toHaveProperty('id')
  })

  it('returns 404 when user is not registered and no register header', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(404)
  })

  it('does not create user when x-auth-source is truthy but not "register"', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer test-auth0-token')
      .set('x-auth-source', 'true')

    expect(res.status).toBe(404)
  })

  it('created Google user has role client', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer test-auth0-token')
      .set('x-auth-source', 'register')

    expect(res.status).toBe(200)
    expect(res.body.role).toBe('client')
  })
})

describe('POST /auth/register', () => {
  it('returns 201 and creates a user', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ _id: 'auth0|new', email: 'newuser@test.com', email_verified: false }),
    } as Response)

    const res = await request(app).post('/auth/register').send({
      name: 'New User',
      email: 'newuser@test.com',
      password: 'Password123!',
    })

    expect(res.status).toBe(201)
    expect(res.body.userId).toBeTypeOf('string')
    expect(res.body.email).toBe('newuser@test.com')
    expect(res.body.emailVerified).toBe(false)
  })

  it('returns 409 when email already exists', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ _id: 'auth0|new', email: 'newuser@test.com', email_verified: false }),
    } as Response)

    await request(app).post('/auth/register').send({
      name: 'New User',
      email: 'newuser@test.com',
      password: 'Password123!',
    })

    const duplicate = await request(app).post('/auth/register').send({
      name: 'New User',
      email: 'newuser@test.com',
      password: 'Password123!',
    })

    expect(duplicate.status).toBe(409)
  })
})

describe('POST /auth/forgot-password', () => {
  it('returns 200 with success message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      text: async () => '',
    } as Response)

    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'user@test.com' })

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('Si el correo está registrado')
  })

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/auth/forgot-password')
      .send({})

    expect(res.status).toBe(400)
  })
})

describe('POST /auth/login', () => {
  it('returns 200 and token data when credentials are valid', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'access-token',
          id_token: 'id-token',
          token_type: 'Bearer',
          expires_in: 86400,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sub: 'auth0|1',
          email: 'test@test.com',
          name: 'Test User',
        }),
      } as Response)

    const res = await request(app).post('/auth/login').send({
      email: 'test@test.com',
      password: 'Password123!',
    })

    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBe('access-token')
    expect(res.body.user.email).toBe('test@test.com')
  })
})

it('does not create duplicated user on second visit', async () => {
  const first = await request(app)
    .get('/auth/me')
    .set('Authorization', 'Bearer test-auth0-token')
    .set('x-auth-source', 'register')

  const second = await request(app)
    .get('/auth/me')
    .set('Authorization', 'Bearer test-auth0-token')

  expect(first.status).toBe(200)
  expect(second.status).toBe(200)
  expect(second.body.id).toBe(first.body.id)
})
