import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../src/index.js'
import { cleanDb } from '../helpers/db.js'

beforeEach(() => cleanDb())

describe('GET /auth/me', () => {
  it('returns 401 when token is missing', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })
})
