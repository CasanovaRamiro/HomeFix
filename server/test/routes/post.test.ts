import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { cleanDb, createUser, createCategory, prisma } from '../helpers/db.js'

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

vi.mock('../../src/middleware/auth0.middleware.js', () => ({
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
  const user = await createUser('test@test.com', 'Test', 'hashed', { role: 'worker' })
  const category = await createCategory('Test Category')
  userId = user.id
  categoryId = category.id
  token = jwt.sign({ sub: userId, email: 'test@test.com', role: 'worker' }, 'test-secret')
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
    expect(res.body).toHaveLength(1)
    expect(res.body[0].title).toBe('Plumber job')
  })

  it('returns empty array when no posts match the category', async () => {
    const res = await request(app)
      .get('/posts/available?category=Nonexistent')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
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
    expect(res.body).toHaveLength(1)
  })

  it('returns 401 without token', async () => {
    const res = await request(app).get('/posts/available')
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
  })

  it('includes description and address', async () => {
    const res = await request(app)
      .get(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.description).toBe('Test description')
    expect(res.body.address).toBe('123 Test St')
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
