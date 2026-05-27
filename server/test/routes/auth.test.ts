import { describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import { errorHandler } from '../../src/middleware/error.middleware.js'

const registerMock = vi.fn<(args: unknown) => Promise<{ token: string; user: { id: number; email: string } }>>()
const loginMock = vi.fn<(args: unknown) => Promise<{ token: string; user: { id: number; email: string } }>>()

vi.mock('../../src/services/auth.service.js', () => ({
  register: registerMock,
  login: loginMock,
}))

const { default: authRoutes } = await import('../../src/routes/auth.routes.js')

const app = express()
app.use(express.json())
app.use('/auth', authRoutes)
app.use(errorHandler)

const mockResult = {
  token: 'jwt-token',
  user: { id: 1, name: 'Jane', email: 'jane@test.com', phone: null, role: 'user', createdAt: new Date().toISOString() },
}

describe('POST /auth/register', () => {
  it('creates a user and returns a token', async () => {
    registerMock.mockResolvedValue(mockResult)

    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Jane', email: 'jane@test.com', password: 'secret123', nationalId: 'DNI-12345678' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.email).toBe('jane@test.com')
    expect(res.body.user).not.toHaveProperty('password')
    expect(registerMock).toHaveBeenCalledWith({ name: 'Jane', email: 'jane@test.com', password: 'secret123', nationalId: 'DNI-12345678' })
  })

  it('returns 400 when email is already taken', async () => {
    registerMock.mockRejectedValue(new Error('Email already in use'))

    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Jane', email: 'jane@test.com', password: 'secret123', nationalId: 'DNI-12345678' })

    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toBe('Email already in use')
  })
})

describe('POST /auth/login', () => {
  it('returns a token on valid credentials', async () => {
    loginMock.mockResolvedValue(mockResult)

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@test.com', password: 'secret123' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  it('returns 401 on wrong password', async () => {
    loginMock.mockRejectedValue(new Error('Invalid credentials'))

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@test.com', password: 'wrongpassword' })

    expect(res.status).toBe(401)
  })

  it('returns 401 for unknown email', async () => {
    loginMock.mockRejectedValue(new Error('Invalid credentials'))

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@test.com', password: 'secret123' })

    expect(res.status).toBe(401)
  })
})
