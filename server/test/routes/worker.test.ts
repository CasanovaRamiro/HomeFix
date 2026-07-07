import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../src/presentation/middleware/auth0.middleware.js', async () => {
  const mock = await import('../helpers/auth0Mock.js')
  return { jwtCheck: mock.jwtCheck }
})

import request from 'supertest'
import { app } from '../../src/index.js'
import { cleanDb, prisma, createUser } from '../helpers/db.js'
import { UserRole } from '../../src/domain/types/userRole.js'

beforeEach(() => cleanDb())

const makeWorker = (email: string, name: string) => createUser(email, name, 'hashed', { role: UserRole.Worker })
const makeUser = (email: string, name: string) => createUser(email, name, 'hashed', { role: 'user' })

describe('GET /workers', () => {
  it('returns all workers when authenticated', async () => {
    await Promise.all([
      makeWorker('ana@test.com', 'Ana'),
      makeWorker('bob@test.com', 'Bob'),
    ])

    const res = await request(app)
      .get('/workers')
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    res.body.forEach((w: { role: string }) => expect(w.role).toBe(UserRole.Worker))
  })

  it('does not return non-worker users', async () => {
    await makeWorker('ana@test.com', 'Ana')

    const res = await request(app)
      .get('/workers')
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/workers')
    expect(res.status).toBe(401)
  })
})

describe('GET /workers/:id', () => {
  it('returns the worker when found', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')

    const res = await request(app)
      .get(`/workers/${worker.id}`)
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(200)
    expect(res.body.email).toBe('ana@test.com')
    expect(res.body.role).toBe(UserRole.Worker)
    expect(res.body).not.toHaveProperty('password')
    expect(res.body).toHaveProperty('categories')
    expect(Array.isArray(res.body.categories)).toBe(true)
    expect(res.body).toHaveProperty('bio')
  })

  it('returns the categories assigned to the worker', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')
    const category = await prisma.category.create({ data: { name: 'Plumbing' } })
    await prisma.userCategory.create({
      data: { userId: worker.id, categoryId: category.id },
    })

    const res = await request(app)
      .get(`/workers/${worker.id}`)
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(200)
    expect(res.body.categories).toHaveLength(1)
    expect(res.body.categories[0].name).toBe('Plumbing')
  })

  it('returns 404 when the worker id does not exist', async () => {
    const res = await request(app)
      .get('/workers/non-existent-uuid')
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(404)
  })

  it('returns 404 when the worker does not exist', async () => {
    const res = await request(app)
      .get('/workers/non-existent-id')
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(404)
  })

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/workers/non-existent-id')
    expect(res.status).toBe(401)
  })
})

describe('GET /workers/:id/reviews', () => {
  it('returns reviews for a worker', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')
    const client = await makeUser('carlos@test.com', 'Carlos')
    const post = await prisma.post.create({
      data: {
        userId: client.id,
        title: 'Fix pipes',
        description: 'Need a plumber',
        address: '123 Main St',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-02'),
      },
    })
    const application = await prisma.application.create({
      data: { workerId: worker.id, postId: post.id, status: 'Accepted' },
    })
    await prisma.workerReview.create({
      data: {
        applicationId: application.id,
        reviewerId: client.id,
        workerId: worker.id,
        description: 'Great work!',
        rating: 5,
      },
    })

    const res = await request(app)
      .get(`/workers/${worker.id}/reviews`)
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].rating).toBe(5)
    expect(res.body[0].description).toBe('Great work!')
    expect(res.body[0].reviewer.name).toBe('Carlos')
    expect(res.body[0].application.post.title).toBe('Fix pipes')
  })

  it('returns an empty array when the worker has no reviews', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')

    const res = await request(app)
      .get(`/workers/${worker.id}/reviews`)
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns 404 when the worker does not exist', async () => {
    const res = await request(app)
      .get('/workers/non-existent-id/reviews')
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(404)
  })

  it('returns 404 when the worker id does not exist', async () => {
    const res = await request(app)
      .get('/workers/non-existent-uuid/reviews')
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(404)
  })

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/workers/non-existent-id/reviews')
    expect(res.status).toBe(401)
  })
})

describe('GET /workers/:id/stats', () => {
  it('returns worker stats', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')

    const res = await request(app)
      .get(`/workers/${worker.id}/stats`)
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('cancelledJobs')
    expect(res.body).toHaveProperty('reports')
    expect(res.body).toHaveProperty('totalJobs')
    expect(res.body).toHaveProperty('avgRating')
    expect(res.body).toHaveProperty('reviewCount')
    expect(res.body.reports).toBe(0)
    expect(res.body.totalJobs).toBe(0)
    expect(res.body.cancelledJobs).toBe(0)
  })

  it('returns correct cancelledJobs count', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')
    const client = await makeUser('carlos@test.com', 'Carlos')
    const post = await prisma.post.create({
      data: {
        userId: client.id,
        title: 'Fix pipes',
        description: 'Need a plumber',
        address: '123 Main St',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-02'),
      },
    })
    await prisma.application.create({
      data: { workerId: worker.id, postId: post.id, status: 'Dismissed' },
    })

    const res = await request(app)
      .get(`/workers/${worker.id}/stats`)
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(200)
    expect(res.body.cancelledJobs).toBe(1)
  })

  it('returns 404 when the worker does not exist', async () => {
    const res = await request(app)
      .get('/workers/non-existent-id/stats')
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(404)
  })

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/workers/non-existent-id/stats')
    expect(res.status).toBe(401)
  })
})

describe('PATCH /workers/:id - matriculaUrl', () => {
  it('updates matriculaUrl when the requester is the owner', async () => {
    const worker = await makeWorker('test@test.com', 'Test')

    const res = await request(app)
      .patch(`/workers/${worker.id}`)
      .set('Authorization', 'Bearer test-auth0-token')
      .send({ matriculaUrl: 'https://res.cloudinary.com/demo/upload/matricula.pdf' })

    expect(res.status).toBe(200)
    expect(res.body.matriculaUrl).toBe('https://res.cloudinary.com/demo/upload/matricula.pdf')
  })

  it('returns matriculaUrl as null when not set', async () => {
    const worker = await makeWorker('test@test.com', 'Test')

    const res = await request(app)
      .get(`/workers/${worker.id}`)
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(200)
    expect(res.body.matriculaUrl).toBeNull()
  })

  it('can clear matriculaUrl by sending null', async () => {
    const worker = await makeWorker('test@test.com', 'Test')

    await request(app)
      .patch(`/workers/${worker.id}`)
      .set('Authorization', 'Bearer test-auth0-token')
      .send({ matriculaUrl: 'https://res.cloudinary.com/demo/upload/matricula.pdf' })

    const res = await request(app)
      .patch(`/workers/${worker.id}`)
      .set('Authorization', 'Bearer test-auth0-token')
      .send({ matriculaUrl: null })

    expect(res.status).toBe(200)
    expect(res.body.matriculaUrl).toBeNull()
  })
})
