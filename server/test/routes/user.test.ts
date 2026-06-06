import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { UserRole } from '../../src/domain/types/userRole.js'
import { cleanDb, createUser, prisma } from '../helpers/db.js'

const mockPayload = vi.hoisted(() => ({
  sub: 'auth0|test123',
  email: 'client@test.com',
  name: 'Client User',
}))

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

import request from 'supertest'
import { app } from '../../src/index.js'

let token: string
let clientId: string
let workerId: string
let postId: string
let applicationId: string

beforeEach(async () => {
  await cleanDb()
  const client = await createUser('client@test.com', 'Client', 'hashed', { role: UserRole.Client })
  const worker = await createUser('worker@test.com', 'Worker', 'hashed', { role: UserRole.Worker })
  clientId = client.id
  workerId = worker.id
  token = 'test-token'

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

  const application = await prisma.application.create({
    data: { workerId, postId, status: 'Accepted' },
  })
  applicationId = application.id
})

describe('GET /users/:id/reviews', () => {
  it('returns client reviews when ?as=client', async () => {
    await prisma.clientReview.create({
      data: {
        applicationId,
        reviewerId: workerId,
        clientId,
        rating: 4,
        description: 'Great client!',
      },
    })

    const res = await request(app)
      .get(`/users/${clientId}/reviews?as=client`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].rating).toBe(4)
    expect(res.body[0].description).toBe('Great client!')
    expect(res.body[0].reviewer.name).toBe('Worker')
    expect(res.body[0].client.name).toBe('Client')
  })

  it('returns worker reviews when ?as=worker', async () => {
    await prisma.workerReview.create({
      data: {
        applicationId,
        reviewerId: clientId,
        workerId,
        rating: 5,
        description: 'Excellent work!',
      },
    })

    const res = await request(app)
      .get(`/users/${workerId}/reviews?as=worker`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].rating).toBe(5)
    expect(res.body[0].description).toBe('Excellent work!')
    expect(res.body[0].reviewer.name).toBe('Client')
    expect(res.body[0].application.post.title).toBe('Fix pipes')
  })

  it('returns empty array when the user has no reviews', async () => {
    const res = await request(app)
      .get(`/users/${clientId}/reviews?as=client`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns 401 without authorization', async () => {
    const res = await request(app)
      .get(`/users/${clientId}/reviews?as=client`)

    expect(res.status).toBe(401)
  })
})

describe('GET /users/:id/rating', () => {
  it('returns the combined rating summary', async () => {
    await prisma.workerReview.create({
      data: {
        applicationId,
        reviewerId: clientId,
        workerId,
        rating: 5,
        description: 'Great work!',
      },
    })
    await prisma.clientReview.create({
      data: {
        applicationId,
        reviewerId: workerId,
        clientId,
        rating: 4,
        description: 'Great client!',
      },
    })

    const res = await request(app)
      .get(`/users/${clientId}/rating`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('averageRating')
    expect(res.body).toHaveProperty('reviewCount')
    expect(res.body.reviewCount).toBe(1)
  })

  it('returns zeros when the user has no reviews', async () => {
    const res = await request(app)
      .get(`/users/${clientId}/rating`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ averageRating: 0, reviewCount: 0 })
  })

  it('returns 401 without authorization', async () => {
    const res = await request(app)
      .get(`/users/${clientId}/rating`)

    expect(res.status).toBe(401)
  })
})
