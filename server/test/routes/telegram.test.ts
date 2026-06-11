import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import { cleanDb, createUser, prisma } from '../helpers/db.js'

const mockPayload = vi.hoisted(() => {
  const payload: Record<string, string | undefined> = {
    sub: 'auth0|test123',
    email: 'test@test.com',
    name: 'Test User',
  }
  return payload
})

vi.mock('../../src/presentation/middleware/auth0.middleware.js', () => ({
  jwtCheck: (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    ;(req as Request & { auth?: unknown }).auth = { header: {}, token: '', payload: mockPayload }
    next()
  },
}))

vi.mock('../../src/presentation/telegram/bot.js', async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    getBotUsername: vi.fn().mockResolvedValue('HomeFixTestBot'),
  }
})

import { app } from '../../src/index.js'

let token: string

beforeEach(async () => {
  await cleanDb()
  await createUser('test@test.com', 'Test', 'hashed')
  token = 'test-token'
})

describe('POST /telegram/link', () => {
  it('devuelve 201 con code, deepLink y message', async () => {
    const res = await request(app)
      .post('/telegram/link')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('code')
    expect(res.body).toHaveProperty('deepLink')
    expect(res.body).toHaveProperty('message')
    expect(res.body.code).toMatch(/^[A-Z0-9]{8}$/)
    expect(res.body.deepLink).toMatch(/^https:\/\/t\.me\//)
  })

  it('devuelve 401 sin token', async () => {
    const res = await request(app).post('/telegram/link')
    expect(res.status).toBe(401)
  })

  it('guarda el link code en la DB', async () => {
    const res = await request(app)
      .post('/telegram/link')
      .set('Authorization', `Bearer ${token}`)

    const saved = await prisma.telegramLinkCode.findUnique({ where: { code: res.body.code } })
    expect(saved).not.toBeNull()
    expect(saved!.used).toBe(false)
  })
})

describe('GET /telegram/status', () => {
  it('devuelve linked false cuando no está vinculado', async () => {
    const res = await request(app)
      .get('/telegram/status')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.linked).toBe(false)
    expect(res.body.linkedAt).toBeNull()
  })

  it('devuelve linked true cuando está vinculado', async () => {
    await prisma.user.update({
      where: { email: 'test@test.com' },
      data: { telegramChatId: '12345', telegramLinkedAt: new Date() },
    })

    const res = await request(app)
      .get('/telegram/status')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.linked).toBe(true)
    expect(res.body.linkedAt).not.toBeNull()
  })

  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/telegram/status')
    expect(res.status).toBe(401)
  })
})

describe('DELETE /telegram/unlink', () => {
  it('desvincula al usuario', async () => {
    await prisma.user.update({
      where: { email: 'test@test.com' },
      data: { telegramChatId: '12345', telegramLinkedAt: new Date() },
    })

    const res = await request(app)
      .delete('/telegram/unlink')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.message).toContain('desvinculado')

    const user = await prisma.user.findUnique({ where: { email: 'test@test.com' } })
    expect(user?.telegramChatId).toBeNull()
    expect(user?.telegramLinkedAt).toBeNull()
  })

  it('devuelve 401 sin token', async () => {
    const res = await request(app).delete('/telegram/unlink')
    expect(res.status).toBe(401)
  })
})
