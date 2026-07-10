import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import { UserRole } from '../../src/domain/types/userRole.js'
import { cleanDb, createUser, prisma } from '../helpers/db.js'
import type { JWTPayload } from 'express-oauth2-jwt-bearer'
import type { Auth0Claims } from '../../src/domain/services/auth.service.js'

const currentUser: Auth0Claims = {
  sub: 'auth0|test-report-123',
  email: 'client-report@test.com',
  name: 'Report Client',
}

vi.mock('../../src/presentation/middleware/auth0.middleware.js', () => ({
  jwtCheck: (req: Request, _res: Response, next: NextFunction) => {
    ;(req as Request & { auth?: { payload: JWTPayload & Auth0Claims } }).auth = {
      header: {}, token: '', payload: currentUser as JWTPayload & Auth0Claims,
    }
    next()
  },
}))

import { app } from '../../src/index.js'

let clientId: string
let workerId: string
let postId: string
let applicationId: string

beforeEach(async () => {
  await cleanDb()
  const client = await createUser('client-report@test.com', 'Client', 'hashed', { role: UserRole.Client })
  const worker = await createUser('worker-report@test.com', 'Worker', 'hashed', { role: UserRole.Worker })
  clientId = client.id
  workerId = worker.id

  const post = await prisma.post.create({
    data: {
      userId: clientId,
      title: 'Fix pipes',
      description: 'Need a plumber',
      address: '123 Main St',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-02'),
      status: 'Completed',
    },
  })
  postId = post.id

  const app2 = await prisma.application.create({
    data: {
      workerId,
      postId,
      status: 'Completed',
    },
  })
  applicationId = app2.id
})

describe('POST /reports', () => {
  it('returns 201 with created report for valid request', async () => {
    const res = await request(app)
      .post('/reports')
      .set('Authorization', 'Bearer test-token')
      .send({
        targetType: 'application',
        reason: 'MAL_COMPORTAMIENTO',
        applicationId,
      })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.targetType).toBe('application')
    expect(res.body.reason).toBe('MAL_COMPORTAMIENTO')
  })

  it('returns 400 for invalid body', async () => {
    const res = await request(app)
      .post('/reports')
      .set('Authorization', 'Bearer test-token')
      .send({})

    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid targetType', async () => {
    const res = await request(app)
      .post('/reports')
      .set('Authorization', 'Bearer test-token')
      .send({
        targetType: 'invalid',
        reason: 'MAL_COMPORTAMIENTO',
        applicationId,
      })

    expect(res.status).toBe(400)
  })

  it('returns 400 for missing applicationId on application report', async () => {
    const res = await request(app)
      .post('/reports')
      .set('Authorization', 'Bearer test-token')
      .send({
        targetType: 'application',
        reason: 'MAL_COMPORTAMIENTO',
      })

    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent application', async () => {
    const res = await request(app)
      .post('/reports')
      .set('Authorization', 'Bearer test-token')
      .send({
        targetType: 'application',
        reason: 'MAL_COMPORTAMIENTO',
        applicationId: 'non-existent-id',
      })

    expect(res.status).toBe(404)
  })
})
