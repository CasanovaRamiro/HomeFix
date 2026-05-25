import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { cleanDb } from '../helpers/db.js'

vi.mock('../../src/middleware/auth0.middleware.js', async () => {
  const mock = await import('../helpers/auth0Mock.js')
  return { jwtCheck: mock.jwtCheck }
})

import { app } from '../../src/index.js'

beforeEach(() => cleanDb())

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