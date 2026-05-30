import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../src/middleware/auth0.middleware.js', async () => {
  const mock = await import('../helpers/auth0Mock.js')
  return { jwtCheck: mock.jwtCheck }
})

import request from 'supertest'
import { app } from '../../src/index.js'
import { cleanDb, prisma } from '../helpers/db.js'
import { UserRole } from '../../src/types/userRole.js'

beforeEach(() => cleanDb())

const makeWorker = (email: string, name: string) => createUser(email, name, 'hashed', { role: 'worker' })
const makeUser = (email: string, name: string) => createUser(email, name, 'hashed', { role: 'user' })

async function makePost(userId: string,   extra: Record<string, unknown> = {}) {
  return prisma.post.create({
    data: {
      userId,
      title: 'Test Post',
      description: 'Test description',
      address: '123 Main St',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-02'),
      ...extra,
    } as unknown as Prisma.PostCreateInput,
  })
}

describe('GET /workers', () => {
  it('returns all workers when authenticated', async () => {
    await prisma.user.createMany({
      data: [
        { name: 'Ana', email: 'ana@test.com', password: 'hashed', role: UserRole.Worker },
        { name: 'Bob', email: 'bob@test.com', password: 'hashed', role: UserRole.Worker },
      ],
    })

    const res = await request(app)
      .get('/workers')
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    res.body.forEach((w: { role: string }) => expect(w.role).toBe(UserRole.Worker))
  })

  it('does not return non-worker users', async () => {
    await prisma.user.create({
      data: { name: 'Ana', email: 'ana@test.com', password: 'hashed', role: UserRole.Worker },
    })

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
    const worker = await prisma.user.create({
      data: { name: 'Ana', email: 'ana@test.com', password: 'hashed', role: UserRole.Worker },
    })

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
    const worker = await prisma.user.create({
      data: { name: 'Ana', email: 'ana@test.com', password: 'hashed', role: UserRole.Worker },
    })
    const category = await prisma.category.create({ data: { name: 'Plumbing' } })
    await prisma.userCategory.create({
      data: { userId: worker.id, categoryId: category.id },
    })

    const res = await request(app)
      .get(`/workers/${worker.id}`)
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(200)
    expect(res.body.categories).toHaveLength(1)
    expect(res.body.categories[0].category.name).toBe('Plumbing')
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
    const worker = await prisma.user.create({
      data: { name: 'Ana', email: 'ana@test.com', password: 'hashed', role: UserRole.Worker },
    })
    const client = await prisma.user.create({
      data: { name: 'Carlos', email: 'carlos@test.com', password: 'hashed', role: UserRole.Client },
    })
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
    const application = await prisma.jobApplication.create({
      data: { workerId: worker.id, postId: post.id },
    })
    await prisma.workerReview.create({
      data: {
        jobApplicationId: application.id,
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
    expect(res.body[0].jobApplication.post.title).toBe('Test Post')
  })

  it('returns an empty array when the worker has no reviews', async () => {
    const worker = await prisma.user.create({
      data: { name: 'Ana', email: 'ana@test.com', password: 'hashed', role: UserRole.Worker },
    })

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
