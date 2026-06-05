import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import { UserRole } from '../../src/domain/types/userRole.js'
import { cleanDb, createUser, prisma } from '../helpers/db.js'

const mockPayload = vi.hoisted(() => ({
  sub: 'auth0|test123',
  email: 'worker@test.com',
  name: 'Worker User',
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

import { app } from '../../src/index.js'

let token: string
let workerId: string
let clientId: string
let postId: string
let applicationId: string

beforeEach(async () => {
  await cleanDb()
  const worker = await createUser('worker@test.com', 'Worker', 'hashed', { role: UserRole.Worker })
  const client = await createUser('client@test.com', 'Client', 'hashed', { role: UserRole.Client })
  workerId = worker.id
  clientId = client.id
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

describe('POST /client-reviews', () => {
  it('should create a client review with valid data', async () => {
    const res = await request(app)
      .post('/client-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        applicationId,
        rating: 4,
        description: 'Great client, paid on time!',
      })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.rating).toBe(4)
    expect(res.body.description).toBe('Great client, paid on time!')
    expect(res.body.reviewer.name).toBe('Worker')
    expect(res.body.client.name).toBe('Client')
  })

  it('should create a client review without description', async () => {
    const res = await request(app)
      .post('/client-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        applicationId,
        rating: 5,
      })

    expect(res.status).toBe(201)
    expect(res.body.rating).toBe(5)
  })

  it('should return 400 when rating is invalid', async () => {
    const res = await request(app)
      .post('/client-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        applicationId,
        rating: 0,
      })

    expect(res.status).toBe(400)
  })

  it('should return 400 when rating exceeds 5', async () => {
    const res = await request(app)
      .post('/client-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        applicationId,
        rating: 6,
      })

    expect(res.status).toBe(400)
  })

  it('should return 400 when applicationId is missing', async () => {
    const res = await request(app)
      .post('/client-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rating: 5,
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('applicationId is required')
  })

  it('should return 400 when description exceeds 500 characters', async () => {
    const res = await request(app)
      .post('/client-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        applicationId,
        rating: 5,
        description: 'a'.repeat(501),
      })

    expect(res.status).toBe(400)
  })

  it('should return 404 when application does not exist', async () => {
    const res = await request(app)
      .post('/client-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        applicationId: 'non-existent-id',
        rating: 5,
      })

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Application not found')
  })

  it('should return 400 when post is not completed', async () => {
    const activePost = await prisma.post.create({
      data: {
        userId: clientId,
        title: 'Active job',
        description: 'Still active',
        address: '456 Other St',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-02'),
        status: 'Active',
      },
    })

    const activeApplication = await prisma.application.create({
      data: { workerId, postId: activePost.id, status: 'Accepted' },
    })

    const res = await request(app)
      .post('/client-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        applicationId: activeApplication.id,
        rating: 5,
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Post must be completed before reviewing')
  })

  it('should return 400 when client review already exists for the application', async () => {
    await prisma.clientReview.create({
      data: {
        applicationId,
        reviewerId: workerId,
        clientId,
        rating: 5,
        description: 'Already reviewed',
      },
    })

    const res = await request(app)
      .post('/client-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        applicationId,
        rating: 4,
        description: 'Second review',
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('A review already exists for this application')
  })

  it('should return 401 without authorization token', async () => {
    const res = await request(app)
      .post('/client-reviews')
      .send({
        applicationId,
        rating: 5,
      })

    expect(res.status).toBe(401)
  })
})
