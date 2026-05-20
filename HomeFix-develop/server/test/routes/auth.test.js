import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../src/index.js'
import { cleanDb } from '../helpers/db.js'

beforeEach(() => cleanDb())

describe('POST /auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Jane', email: 'jane@test.com', password: 'secret123' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe('jane@test.com')
    expect(res.body.user).not.toHaveProperty('password')
  })

  it('returns 400 when email is already taken', async () => {
    await request(app)
      .post('/auth/register')
      .send({ name: 'Jane', email: 'jane@test.com', password: 'secret123' })

    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Jane', email: 'jane@test.com', password: 'secret123' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
})

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/auth/register')
      .send({ name: 'Jane', email: 'jane@test.com', password: 'secret123' })
  })

  it('returns a token on valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@test.com', password: 'secret123' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@test.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
  })

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@test.com', password: 'secret123' })

    expect(res.status).toBe(401)
  })
})
