import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import { UserRole } from '../../src/domain/types/userRole.js'
import { cleanDb, createUser, prisma } from '../helpers/db.js'
import type { JWTPayload } from 'express-oauth2-jwt-bearer'
import type { Auth0Claims } from '../../src/domain/services/auth.service.js'

let currentUser: Auth0Claims = {
  sub: 'auth0|test123',
  email: 'client@test.com',
  name: 'Client User',
}

vi.mock('../../src/presentation/middleware/auth0.middleware.js', () => ({
  jwtCheck: (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    ;(req as Request & { auth?: { payload: JWTPayload & Auth0Claims } }).auth = { header: {}, token: '', payload: currentUser as JWTPayload & Auth0Claims }
    next()
  },
}))

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
})

describe('POST /reviews', () => {
  beforeEach(async () => {
    currentUser = { sub: 'auth0|test123', email: 'client@test.com', name: 'Client User' }
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

    await prisma.application.create({
      data: {
        workerId,
        postId,
        status: 'Accepted',
      },
    })
  })

  it('should create a review with valid data', async () => {
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        rating: 5,
        description: 'Excellent work!',
      })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.rating).toBe(5)
    expect(res.body.description).toBe('Excellent work!')
    expect(res.body.reviewer.name).toBe('Client')
    expect(res.body.application.post.title).toBe('Fix pipes')
  })

  it('should create a review without description', async () => {
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        rating: 4,
      })

    expect(res.status).toBe(201)
    expect(res.body.rating).toBe(4)
  })

  it('should create a review for a dismissed worker via applicationId on an active post', async () => {
    const reopenedPost = await prisma.post.create({
      data: {
        userId: clientId,
        title: 'Reopened job',
        description: 'Worker was dismissed',
        address: '456 Other St',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-02'),
        status: 'Active',
      },
    })
    const dismissed = await prisma.application.create({
      data: { workerId, postId: reopenedPost.id, status: 'Dismissed' },
    })

    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId: reopenedPost.id,
        applicationId: dismissed.id,
        rating: 1,
        description: 'No se presentó',
      })

    expect(res.status).toBe(201)
    expect(res.body.rating).toBe(1)
  })

  it('should return 400 when reviewing via applicationId a worker that is not dismissed', async () => {
    const activePost = await prisma.post.create({
      data: {
        userId: clientId,
        title: 'Ongoing job',
        description: 'Worker still hired',
        address: '789 Test Ave',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-02'),
        status: 'In progress',
      },
    })
    const accepted = await prisma.application.create({
      data: { workerId, postId: activePost.id, status: 'Accepted' },
    })

    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId: activePost.id,
        applicationId: accepted.id,
        rating: 3,
      })

    expect(res.status).toBe(400)
  })

  it('should return 400 when rating is invalid', async () => {
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        rating: 0,
      })

    expect(res.status).toBe(400)
  })

  it('should return 400 when rating exceeds 5', async () => {
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        rating: 6,
      })

    expect(res.status).toBe(400)
  })

  it('should return 400 when postId is missing', async () => {
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rating: 5,
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('postId is required')
  })

  it('should return 400 when description exceeds 500 characters', async () => {
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId,
        rating: 5,
        description: 'a'.repeat(501),
      })

    expect(res.status).toBe(400)
  })

  it('should return 404 when post does not exist', async () => {
    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId: 'non-existent-id',
        rating: 5,
      })

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Post not found')
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

    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId: activePost.id,
        rating: 5,
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Post must be completed or cancelled before reviewing')
  })

  it('should return 400 when no accepted application exists', async () => {
    const newPost = await prisma.post.create({
      data: {
        userId: clientId,
        title: 'No applicants',
        description: 'No one applied',
        address: '789 Test Ave',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-02'),
        status: 'Completed',
      },
    })

    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId: newPost.id,
        rating: 5,
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('No accepted application found for this post')
  })

  it('should return 403 when post belongs to another user', async () => {
    const otherUser = await createUser('other@test.com', 'Other', 'hashed')
    const otherPost = await prisma.post.create({
      data: {
        userId: otherUser.id,
        title: 'Other post',
        description: 'Not mine',
        address: '000 Nowhere',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-02'),
        status: 'Completed',
      },
    })

    const res = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        postId: otherPost.id,
        rating: 5,
      })

    expect(res.status).toBe(403)
  })
})

describe('POST /reviews/client', () => {
  beforeEach(async () => {
    currentUser = { sub: 'auth0|test123', email: 'worker@test.com', name: 'Worker User' }
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

  it('should create a client review with valid data', async () => {
    const res = await request(app)
      .post('/reviews/client')
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
      .post('/reviews/client')
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
      .post('/reviews/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        applicationId,
        rating: 0,
      })

    expect(res.status).toBe(400)
  })

  it('should return 400 when rating exceeds 5', async () => {
    const res = await request(app)
      .post('/reviews/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        applicationId,
        rating: 6,
      })

    expect(res.status).toBe(400)
  })

  it('should return 400 when applicationId is missing', async () => {
    const res = await request(app)
      .post('/reviews/client')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rating: 5,
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('applicationId is required')
  })

  it('should return 400 when description exceeds 500 characters', async () => {
    const res = await request(app)
      .post('/reviews/client')
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
      .post('/reviews/client')
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
      .post('/reviews/client')
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
      .post('/reviews/client')
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
      .post('/reviews/client')
      .send({
        applicationId,
        rating: 5,
      })

    expect(res.status).toBe(401)
  })
})
