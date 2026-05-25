import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { cleanDb } from '../helpers/db.js'

vi.mock('../../src/middleware/auth0.middleware.js', async () => {
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

  it('returns 200 and syncs user when token is present', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(200)
    expect(res.body.email).toBe('test@test.com')
    expect(res.body).toHaveProperty('id')
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
      password: 'password123',
    })

    expect(res.status).toBe(201)
    expect(res.body.userId).toBeTypeOf('number')
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
      password: 'password123',
    })

    const duplicate = await request(app).post('/auth/register').send({
      name: 'New User',
      email: 'newuser@test.com',
      password: 'password123',
    })

    expect(duplicate.status).toBe(409)
  })
})

it('does not create duplicated user on second visit', async () => {
  const first = await request(app)
    .get('/auth/me')
    .set('Authorization', 'Bearer test-auth0-token')

  const second = await request(app)
    .get('/auth/me')
    .set('Authorization', 'Bearer test-auth0-token')

  expect(first.status).toBe(200)
  expect(second.status).toBe(200)
  expect(second.body.id).toBe(first.body.id)
})
