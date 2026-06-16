import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import { cleanDb, createUser, createCategory, prisma } from '../helpers/db.js'
import { UserRole } from '../../src/domain/types/userRole.js'
import { PostType } from '../../src/domain/types/postType.js'

const { mockPayload, setMockPayload, resetMockPayload } = vi.hoisted(() => {
  const payload: Record<string, string | undefined> = {
    sub: 'auth0|test123',
    email: 'test@test.com',
    name: 'Test User',
  }
  return {
    mockPayload: payload,
    setMockPayload: (p: Record<string, string | undefined>) => {
      Object.keys(payload).forEach(k => delete payload[k])
      Object.assign(payload, p)
    },
    resetMockPayload: () => {
      Object.keys(payload).forEach(k => delete payload[k])
      payload.sub = 'auth0|test123'
      payload.email = 'test@test.com'
      payload.name = 'Test User'
    },
  }
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

import { app } from '../../src/index.js'

let token: string
let userId: string
let categoryId: string

beforeEach(async () => {
  await cleanDb()
  const user = await createUser('test@test.com', 'Test', 'hashed', { role: UserRole.Worker })
  const category = await createCategory('Test Category')
  userId = user.id
  categoryId = category.id
  token = 'test-token'
})

const postInput = (overrides: Record<string, unknown> = {}) => ({
  userId,
  description: 'Test description',
  startDate: new Date('2026-06-01T00:00:00.000Z'),
  endDate: new Date('2026-06-15T00:00:00.000Z'),
  address: '123 Test St',
  categoryId,
  title: 'Test Post',
  ...overrides,
})

describe('GET /posts/available', () => {
  it('returns active posts matching the category', async () => {
    await prisma.post.create({
      data: {
        userId,
        title: 'Plumber job',
        description: 'Fix pipes',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        address: 'Calle 123',
        status: 'Active',
        categories: { create: { categoryId } },
      },
    })

    const res = await request(app)
      .get('/posts/available?category=Test Category')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].title).toBe('Plumber job')
    expect(res.body.data[0].clientRating).toBe(0)
  })

  it('returns empty array when no posts match the category', async () => {
    const res = await request(app)
      .get('/posts/available?category=Nonexistent')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('returns all active posts when no category given', async () => {
    await prisma.post.create({
      data: {
        userId,
        title: 'Job A',
        description: 'A',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        address: 'Calle 1',
        status: 'Active',
        categories: { create: { categoryId } },
      },
    })

    const res = await request(app)
      .get('/posts/available')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].clientRating).toBe(0)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/posts/available')
    expect(res.status).toBe(401)
  })
})

describe('GET /posts/availableSubcontracts', () => {
  it('returns active subcontracts', async () => {
    await prisma.post.create({
      data: {
        userId,
        title: 'Albañil needed',
        description: 'Need albañil for kitchen',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        address: 'Calle 123',
        status: 'Active',
        type: 'subcontract',
        categories: { create: { categoryId } },
      },
    })

    const res = await request(app)
      .get('/posts/availableSubcontracts')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].title).toBe('Albañil needed')
    expect(res.body[0].type).toBe('subcontract')
    expect(res.body[0].clientRating).toBe(0)
  })

  it('excludes regular posts', async () => {
    await prisma.post.create({
      data: {
        userId,
        title: 'Regular post',
        description: 'Not a subcontract',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        address: 'Calle 123',
        status: 'Active',
        type: 'post',
        categories: { create: { categoryId } },
      },
    })

    const res = await request(app)
      .get('/posts/availableSubcontracts')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns 403 when user role is not worker', async () => {
    await createUser('client2@test.com', 'Client', 'hashed', { role: UserRole.Client })
    setMockPayload({ sub: 'auth0|client2', email: 'client2@test.com' })

    const res = await request(app)
      .get('/posts/availableSubcontracts')
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(403)
    resetMockPayload()
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/posts/availableSubcontracts')
    expect(res.status).toBe(401)
  })
})

describe('GET /posts/subcontracts/:id', () => {
  let subcontractId: string
  let categoryIdLocal: string

  beforeEach(async () => {
    const client = await createUser('client@test.com', 'Client', 'hashed', { role: UserRole.Client })
    const mmo = await createUser('mmo@test.com', 'MMO', 'hashed', { role: UserRole.Worker })
    const cat = await createCategory('Plomero')
    categoryIdLocal = cat.id

    const parentPost = await prisma.post.create({
      data: {
        userId: client.id,
        title: 'Parent job',
        description: 'Original job',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        address: 'Calle 123',
        status: 'Active',
        categories: { create: { categoryId: cat.id } },
      },
    })

    await prisma.application.create({
      data: { workerId: mmo.id, postId: parentPost.id, status: 'Accepted' },
    })

    const subcontract = await prisma.post.create({
      data: {
        userId: mmo.id,
        type: PostType.SubContract,
        parentPostId: parentPost.id,
        title: 'Plomero needed',
        description: 'Need plumber',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        address: 'Calle 123',
        status: 'Active',
        categories: { create: { categoryId: cat.id } },
      },
    })
    subcontractId = subcontract.id
  })

  it('returns subcontract with both ratings', async () => {
    const res = await request(app)
      .get(`/posts/subcontracts/${subcontractId}`)
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(200)
    expect(res.body.type).toBe('subcontract')
    expect(res.body).toHaveProperty('workerRating')
    expect(res.body).toHaveProperty('clientRating')
    expect(res.body.title).toBe('Plomero needed')
  })

  it('returns 404 for regular post', async () => {
    const regularPost = await prisma.post.create({
      data: {
        userId: userId,
        title: 'Regular post',
        description: 'Not subcontract',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        address: 'Calle 123',
        status: 'Active',
        categories: { create: { categoryId: categoryIdLocal } },
      },
    })

    const res = await request(app)
      .get(`/posts/subcontracts/${regularPost.id}`)
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Subcontract not found')
  })

  it('returns 404 for non-existent ID', async () => {
    const res = await request(app)
      .get('/posts/subcontracts/non-existent-id')
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Subcontract not found')
  })

  it('returns 403 when user is not worker', async () => {
    await createUser('client2@test.com', 'Client', 'hashed', { role: UserRole.Client })
    setMockPayload({ sub: 'auth0|client2', email: 'client2@test.com' })

    const res = await request(app)
      .get(`/posts/subcontracts/${subcontractId}`)
      .set('Authorization', 'Bearer test-token')

    expect(res.status).toBe(403)
    resetMockPayload()
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get(`/posts/subcontracts/${subcontractId}`)
    expect(res.status).toBe(401)
  })
})

describe('GET /posts/search-location', () => {
  it('returns posts within the given radius', async () => {
    await prisma.post.create({
      data: {
        userId,
        title: 'Nearby job',
        description: 'Close by',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        address: 'Calle 123',
        status: 'Active',
        latitude: -34.6,
        longitude: -58.4,
        categories: { create: { categoryId } },
      },
    })

    const res = await request(app)
      .get('/posts/search-location?lat=-34.6&lng=-58.4&radius=50')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].title).toBe('Nearby job')
    expect(res.body[0].clientRating).toBe(0)
  })

  it('returns empty array when no posts within radius', async () => {
    const res = await request(app)
      .get('/posts/search-location?lat=-90&lng=0&radius=1')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns 400 for invalid latitude', async () => {
    const res = await request(app)
      .get('/posts/search-location?lat=200&lng=0&radius=10')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/posts/search-location?lat=0&lng=0&radius=10')
    expect(res.status).toBe(401)
  })
})

describe('GET /posts/:id', () => {
  let postId: string

  beforeEach(async () => {
    const res = await request(app)
      .post('/posts/create')
      .set('Authorization', `Bearer ${token}`)
      .send(postInput())
    postId = res.body.id
  })

  it('returns the post with categories', async () => {
    const res = await request(app)
      .get(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Test Post')
    expect(res.body.categories).toHaveLength(1)
    expect(res.body.categories[0].name).toBe('Test Category')
    expect(res.body.clientRating).toBe(0)
  })

  it('includes description and address', async () => {
    const res = await request(app)
      .get(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.description).toBe('Test description')
    expect(res.body.address).toBe('123 Test St')
    expect(res.body.clientRating).toBe(0)
  })

  it('returns 404 for non-existent post', async () => {
    const res = await request(app)
      .get('/posts/9999')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Post not found')
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get(`/posts/${postId}`)
    expect(res.status).toBe(401)
  })
})

describe('POST /posts/create', () => {
  it('creates a new post', async () => {
    const res = await request(app)
      .post('/posts/create')
      .set('Authorization', `Bearer ${token}`)
      .send(postInput())
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.title).toBe('Test Post')
  })

  it('returns 400 for empty title', async () => {
    const res = await request(app)
      .post('/posts/create')
      .set('Authorization', `Bearer ${token}`)
      .send(postInput({ title: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).post('/posts/create').send(postInput())
    expect(res.status).toBe(401)
  })

  it('should return 401 when token payload lacks sub claim', async () => {
    setMockPayload({ email: 'test@test.com' })
    const res = await request(app)
      .post('/posts/create')
      .set('Authorization', 'Bearer test-auth0-token')
      .send(postInput())
    expect(res.status).toBe(401)
    resetMockPayload()
  })

})

describe('POST /posts/user-posts', () => {
  it('returns posts for the authenticated user', async () => {
    await prisma.post.create({
      data: {
        userId,
        title: 'Dashboard Post',
        description: 'For dashboard',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        address: '456 Test Ave',
        status: 'Active',
        categories: { create: { categoryId } },
      },
    })

    const res = await request(app)
      .post('/posts/user-posts')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].title).toBe('Dashboard Post')
    expect(res.body[0].categories).toEqual([{ id: expect.any(String), name: 'Test Category' }])
    expect(res.body[0].applicantCount).toBe(0)
  })

  it('returns the accepted worker, not the first applicant', async () => {
    const post = await prisma.post.create({
      data: {
        userId,
        title: 'Post con múltiples postulantes',
        description: 'Test',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        address: 'Calle 1',
        status: 'In progress',
        categories: { create: { categoryId } },
      },
    })
    const first = await createUser('first@test.com', 'First', 'hashed', { role: UserRole.Worker })
    const accepted = await createUser('accepted@test.com', 'Accepted', 'hashed', { role: UserRole.Worker })
    await prisma.application.create({ data: { postId: post.id, workerId: first.id, status: 'Rejected' } })
    await prisma.application.create({ data: { postId: post.id, workerId: accepted.id, status: 'Accepted' } })

    const res = await request(app)
      .post('/posts/user-posts')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const found = res.body.find((p: { id: string }) => p.id === post.id)
    expect(found).toBeDefined()
    expect(found.worker.id).toBe(accepted.id)
    expect(found.worker.name).toBe('Accepted')
  })

  it('returns hasReview: false for a completed post without a review', async () => {
    const post = await prisma.post.create({
      data: {
        userId,
        title: 'Completed No Review',
        description: 'Test',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        address: 'Calle 1',
        status: 'Completed',
        categories: { create: { categoryId } },
      },
    })
    const worker = await createUser('worker@test.com', 'Worker', 'hashed', { role: UserRole.Worker })
    await prisma.application.create({
      data: { postId: post.id, workerId: worker.id, status: 'Completed' },
    })

    const res = await request(app)
      .post('/posts/user-posts')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const found = res.body.find((p: { id: string }) => p.id === post.id)
    expect(found).toBeDefined()
    expect(found.hasReview).toBe(false)
  })

  it('returns hasReview: true for a completed post that has been reviewed', async () => {
    const post = await prisma.post.create({
      data: {
        userId,
        title: 'Completed With Review',
        description: 'Test',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        address: 'Calle 2',
        status: 'Completed',
        categories: { create: { categoryId } },
      },
    })
    const worker = await createUser('worker2@test.com', 'Worker2', 'hashed', { role: UserRole.Worker })
    const application = await prisma.application.create({
      data: { postId: post.id, workerId: worker.id, status: 'Completed' },
    })
    await prisma.workerReview.create({
      data: {
        applicationId: application.id,
        reviewerId: userId,
        workerId: worker.id,
        rating: 5,
        description: 'Great work',
      },
    })

    const res = await request(app)
      .post('/posts/user-posts')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const found = res.body.find((p: { id: string }) => p.id === post.id)
    expect(found).toBeDefined()
    expect(found.hasReview).toBe(true)
  })

  it('returns empty array when the user has no posts', async () => {
    const res = await request(app)
      .post('/posts/user-posts')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns 401 without token', async () => {
    const res = await request(app).post('/posts/user-posts')
    expect(res.status).toBe(401)
  })
})

describe('PATCH /posts/:id/pause', () => {
  let postId: string

  beforeEach(async () => {
    const post = await prisma.post.create({
      data: {
        userId,
        title: 'Trabajo a pausar',
        description: 'Test',
        address: 'Calle 123',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'Active',
        categories: { create: { categoryId } },
      },
    })
    postId = post.id
  })

  it('devuelve 200 y status Paused cuando el post está Active', async () => {
    const res = await request(app)
      .patch(`/posts/${postId}/pause`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('Paused')
  })

  it('devuelve 200 y status Active cuando el post está Paused (toggle)', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'Paused' } })

    const res = await request(app)
      .patch(`/posts/${postId}/pause`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('Active')
  })

  it('returns 400 when post is in invalid state (In progress)', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'In progress' } })

    const res = await request(app)
      .patch(`/posts/${postId}/pause`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
  })

  it('returns 400 when post is Completed', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'Completed' } })

    const res = await request(app)
      .patch(`/posts/${postId}/pause`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
  })

  it('returns 400 when post is Cancelled', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'Cancelled' } })

    const res = await request(app)
      .patch(`/posts/${postId}/pause`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
  })

  it('returns 403 when post belongs to another user', async () => {
    const otro = await createUser('otro@test.com', 'Otro', 'hashed')
    const postAjeno = await prisma.post.create({
      data: {
        userId: otro.id,
        title: 'Post ajeno',
        description: 'Test',
        address: 'Otra calle',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'Active',
        categories: { create: { categoryId } },
      },
    })

    const res = await request(app)
      .patch(`/posts/${postAjeno.id}/pause`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('returns 404 when post does not exist', async () => {
    const res = await request(app)
      .patch('/posts/id-inexistente/pause')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).patch(`/posts/${postId}/pause`)
    expect(res.status).toBe(401)
  })
})

describe('PATCH /posts/:id/cancel', () => {
  let postId: string

  beforeEach(async () => {
    const post = await prisma.post.create({
      data: {
        userId,
        title: 'Trabajo a cancelar',
        description: 'Test',
        address: 'Calle 123',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'Active',
        categories: { create: { categoryId } },
      },
    })
    postId = post.id
  })

  it('devuelve 200 y status Cancelled cuando el post está Active', async () => {
    const res = await request(app)
      .patch(`/posts/${postId}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('Cancelled')
  })

  it('devuelve 200 y status Cancelled cuando el post está Paused', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'Paused' } })

    const res = await request(app)
      .patch(`/posts/${postId}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('Cancelled')
  })

  it('devuelve 200 y status Cancelled cuando el post está In progress', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'In progress' } })

    const res = await request(app)
      .patch(`/posts/${postId}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('Cancelled')
  })

  it('conserva la application Accepted y permite reseñar al trabajador tras cancelar la contratación', async () => {
    const worker = await createUser('worker-cancel@test.com', 'Worker', 'hashed', { role: UserRole.Worker })
    await prisma.post.update({ where: { id: postId }, data: { status: 'In progress' } })
    const application = await prisma.application.create({
      data: { workerId: worker.id, postId, status: 'Accepted' },
    })

    const cancelRes = await request(app)
      .patch(`/posts/${postId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
    expect(cancelRes.status).toBe(200)
    expect(cancelRes.body.status).toBe('Cancelled')

    // The accepted application survives the cancellation.
    const stillAccepted = await prisma.application.findUnique({ where: { id: application.id } })
    expect(stillAccepted?.status).toBe('Accepted')

    // The client can review the worker on the cancelled contract.
    const reviewRes = await request(app)
      .post('/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ postId, rating: 2, description: 'No se presentó' })
    expect(reviewRes.status).toBe(201)
    expect(reviewRes.body.rating).toBe(2)
  })

  it('returns 400 when post is Completed', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'Completed' } })

    const res = await request(app)
      .patch(`/posts/${postId}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
  })

  it('returns 400 when post is already Cancelled', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'Cancelled' } })

    const res = await request(app)
      .patch(`/posts/${postId}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
  })

  it('returns 403 when post belongs to another user', async () => {
    const otro = await createUser('otro@test.com', 'Otro', 'hashed')
    const postAjeno = await prisma.post.create({
      data: {
        userId: otro.id,
        title: 'Post ajeno',
        description: 'Test',
        address: 'Otra calle',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'Active',
        categories: { create: { categoryId } },
      },
    })

    const res = await request(app)
      .patch(`/posts/${postAjeno.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('returns 404 when post does not exist', async () => {
    const res = await request(app)
      .patch('/posts/id-inexistente/cancel')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).patch(`/posts/${postId}/cancel`)
    expect(res.status).toBe(401)
  })
})

describe('PATCH /posts/:id/finalize', () => {
  let postId: string

  beforeEach(async () => {
    const post = await prisma.post.create({
      data: {
        userId,
        title: 'Trabajo a finalizar',
        description: 'Test',
        address: 'Calle 123',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'Paused',
        categories: { create: { categoryId } },
      },
    })
    postId = post.id
  })


  it('devuelve 200 y status Completed cuando el post está Paused y es del usuario', async () => {

    const res = await request(app)
      .patch(`/posts/${postId}/finalize`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('Completed')
  })

  it('returns 400 when post is not Paused', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'Active' } })

    const res = await request(app)
      .patch(`/posts/${postId}/finalize`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
  })

  it('returns 403 when post belongs to another user', async () => {
    const otro = await createUser('otro@test.com', 'Otro', 'hashed')
    const postAjeno = await prisma.post.create({
      data: {
        userId: otro.id,
        title: 'Post ajeno',
        description: 'Test',
        address: 'Otra calle',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'Paused',
        categories: { create: { categoryId } },
      },
    })

    const res = await request(app)
      .patch(`/posts/${postAjeno.id}/finalize`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(403)
  })

  it('returns 404 when post does not exist', async () => {
    const res = await request(app)
      .patch('/posts/id-inexistente/finalize')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).patch(`/posts/${postId}/finalize`)
    expect(res.status).toBe(401)
  })
})

describe('PATCH /posts/:id (update)', () => {
  let postId: string

  beforeEach(async () => {
    const post = await prisma.post.create({
      data: {
        userId,
        title: 'Post original',
        description: 'Descripción original',
        address: 'Calle original 123',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'Active',
        categories: { create: { categoryId } },
      },
    })
    postId = post.id
  })

  it('actualiza un post activo', async () => {
    const res = await request(app)
      .patch(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Título editado',
        description: 'Descripción editada',
        startDate: '2026-06-01',
        endDate: '2026-06-20',
        address: 'Nueva dirección 456',
        categoryId,
      })

    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Título editado')
    expect(res.body.description).toBe('Descripción editada')
    expect(res.body.address).toBe('Nueva dirección 456')
  })

  it('actualiza un post pausado', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'Paused' } })

    const res = await request(app)
      .patch(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Título editado',
        description: 'Descripción editada',
        startDate: '2026-06-01',
        endDate: '2026-06-20',
        address: 'Nueva dirección 456',
        categoryId,
      })

    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Título editado')
  })

  it('returns 400 si el post está In progress', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'In progress' } })

    const res = await request(app)
      .patch(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'x', description: 'x', startDate: '2026-06-01', endDate: '2026-06-15', address: 'x', categoryId })

    expect(res.status).toBe(400)
  })

  it('returns 400 si el post está Completed', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'Completed' } })

    const res = await request(app)
      .patch(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'x', description: 'x', startDate: '2026-06-01', endDate: '2026-06-15', address: 'x', categoryId })

    expect(res.status).toBe(400)
  })

  it('returns 400 si el post está Cancelled', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'Cancelled' } })

    const res = await request(app)
      .patch(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'x', description: 'x', startDate: '2026-06-01', endDate: '2026-06-15', address: 'x', categoryId })

    expect(res.status).toBe(400)
  })

  it('returns 403 para post ajeno', async () => {
    const otro = await createUser('otro@test.com', 'Otro', 'hashed')
    const postAjeno = await prisma.post.create({
      data: {
        userId: otro.id,
        title: 'Post ajeno',
        description: 'Test',
        address: 'Otra calle',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'Active',
        categories: { create: { categoryId } },
      },
    })

    const res = await request(app)
      .patch(`/posts/${postAjeno.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'x', description: 'x', startDate: '2026-06-01', endDate: '2026-06-15', address: 'x', categoryId })

    expect(res.status).toBe(403)
  })

  it('returns 404 si el post no existe', async () => {
    const res = await request(app)
      .patch('/posts/id-inexistente')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'x', description: 'x', startDate: '2026-06-01', endDate: '2026-06-15', address: 'x', categoryId })

    expect(res.status).toBe(404)
  })

  it('returns 400 si faltan campos obligatorios', async () => {
    const res = await request(app)
      .patch(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '', description: '', startDate: '', endDate: '', address: '', categoryId: '' })

    expect(res.status).toBe(400)
  })

  it('returns 401 sin token', async () => {
    const res = await request(app)
      .patch(`/posts/${postId}`)
      .send({ title: 'x', description: 'x', startDate: '2026-06-01', endDate: '2026-06-15', address: 'x', categoryId })

    expect(res.status).toBe(401)
  })
})

describe('POST /posts/create-subcontract', () => {
  let parentPostId: string
  let catAlbanilId: string
  let catElectricistaId: string

  beforeEach(async () => {
    const client = await createUser('client@test.com', 'Client', 'hashed', { role: UserRole.Client })
    const cat1 = await createCategory('Albañil')
    const cat2 = await createCategory('Electricista')
    catAlbanilId = cat1.id
    catElectricistaId = cat2.id

    const post = await prisma.post.create({
      data: {
        userId: client.id,
        title: 'Arreglo de cocina',
        description: 'Arreglar la cocina completa',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-15'),
        address: 'Calle 123',
        status: 'Active',
        categories: { create: { categoryId: cat1.id } },
      },
    })
    parentPostId = post.id

    const mmo = await createUser('mmo@test.com', 'MMO', 'hashed', { role: UserRole.Worker })
    await prisma.application.create({
      data: { workerId: mmo.id, postId: post.id, status: 'Accepted' },
    })

    setMockPayload({ sub: 'auth0|mmo', email: 'mmo@test.com' })
  })

  afterEach(() => {
    resetMockPayload()
  })

  const validPayload = () => ({
    parentPostId,
    positions: [
      { categoryId: catAlbanilId, quantity: 2, roleDescription: 'Albañilería general' },
      { categoryId: catElectricistaId, quantity: 1, roleDescription: 'Instalación eléctrica' },
    ],
  })

  it('creates a subcontract linked to a parent post', async () => {
    const res = await request(app)
      .post('/posts/create-subcontract')
      .set('Authorization', 'Bearer test-token')
      .send(validPayload())

    expect(res.status).toBe(201)
    expect(res.body).toHaveLength(2)
    expect(res.body[0]).toHaveProperty('id')
    expect(res.body[0].type).toBe('subcontract')
    expect(res.body[0].parentPostId).toBe(parentPostId)
    expect(res.body[0].title).toBe('Subcontratación: Arreglo de cocina - Albañilería general')
    expect(res.body[1].parentPostId).toBe(parentPostId)
    expect(res.body[1].title).toBe('Subcontratación: Arreglo de cocina - Instalación eléctrica')
  })

  it('returns 401 without token', async () => {
    const res = await request(app).post('/posts/create-subcontract').send(validPayload())
    expect(res.status).toBe(401)
  })

  it('returns 400 when positions is empty', async () => {
    const res = await request(app)
      .post('/posts/create-subcontract')
      .set('Authorization', 'Bearer test-token')
      .send({ parentPostId, positions: [] })
    expect(res.status).toBe(400)
  })

  it('returns 404 when parentPost does not exist', async () => {
    const res = await request(app)
      .post('/posts/create-subcontract')
      .set('Authorization', 'Bearer test-token')
      .send({ parentPostId: 'non-existent-id', positions: validPayload().positions })
    expect(res.status).toBe(404)
  })

  it('returns 403 when user is not the accepted MMO on parentPost', async () => {
    await createUser('otro@test.com', 'Otro', 'hashed', { role: UserRole.Worker })
    setMockPayload({ sub: 'auth0|otro', email: 'otro@test.com' })

    const res = await request(app)
      .post('/posts/create-subcontract')
      .set('Authorization', 'Bearer test-token')
      .send(validPayload())
    expect(res.status).toBe(403)
  })
})
