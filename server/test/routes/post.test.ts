import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import { cleanDb, createUser, createCategory, prisma } from '../helpers/db.js'
import { PostInput } from '../../src/types/postInput.js'

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
  const user = await createUser({ email: 'test@test.com', name: 'Test', password: 'hashed' })
  const category = await createCategory('Test Category')
  userId = user.id
  categoryId = category.id
  token = 'test-auth0-token'
})

let postId: string

const createValidPost = (): PostInput => ({
  userId,
  description: 'Test description',
  startDate: new Date('2026-06-01T00:00:00.000Z'),
  endDate: new Date('2026-06-15T00:00:00.000Z'),
  address: '123 Test St',
  categoryId,
  title: 'Test Post',
})

describe('GET /posts/:id', () => {
  beforeEach(async () => {
    const res = await request(app)
      .post('/posts/create')
      .set('Authorization', `Bearer ${token}`)
      .send(createValidPost())
    postId = res.body.id
  })

  it('should return a post with categories', async () => {
    const res = await request(app)
      .get(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Test Post')
    expect(res.body.categories).toHaveLength(1)
    expect(res.body.categories[0].category.name).toBe('Test Category')
  })

  it('should contain description and address fields', async () => {
    const res = await request(app)
      .get(`/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.description).toBe('Test description')
    expect(res.body.address).toBe('123 Test St')
  })

  it('should return 404 for non-existent post', async () => {
    const res = await request(app)
      .get('/posts/9999')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Post not found')
  })

  it('should return 401 for unauthorized access', async () => {
    const res = await request(app).get(`/posts/${postId}`)
    expect(res.status).toBe(401)
  })
})

describe('POST /posts/create', () => {

  it('should create a new post', async () => {
    const res = await request(app)
      .post('/posts/create')
      .set('Authorization', `Bearer ${token}`)
      .send(createValidPost())
    expect(res.status).toBe(201)

    expect(res.body).toHaveProperty('id')
    expect(res.body.title).toBe('Test Post')
  })

  it('should return 400 for invalid post data', async () => {
    const res = await request(app)
      .post('/posts/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...createValidPost(), title: '' })
    expect(res.status).toBe(400)
  })

  it('should return 401 for unauthorized access', async () => {
    const res = await request(app).post('/posts/create').send(createValidPost())
    expect(res.status).toBe(401)
  })

  it('should return 401 when token payload lacks sub claim', async () => {
    setMockPayload({ email: 'test@test.com' })
    const res = await request(app)
      .post('/posts/create')
      .set('Authorization', 'Bearer test-auth0-token')
      .send(createValidPost())
    expect(res.status).toBe(401)
    resetMockPayload()
  })

})

describe('POST /posts/user-posts', () => {
  it('should return posts for the authenticated user', async () => {
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

  it('should return empty array when authenticated user has no posts', async () => {
    const res = await request(app)
      .post('/posts/user-posts')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('should return 401 without token', async () => {
    const res = await request(app).post('/posts/user-posts')

    expect(res.status).toBe(401)
  })
})
describe('PATCH /posts/:id/finalize', () => {
  let postId: string

  beforeEach(async () => {
    const createdPost = await prisma.post.create({
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
    postId = createdPost.id
  })

  it('devuelve 200 y status Finalized cuando el post está Paused y es del usuario', async () => {
    const res = await request(app)
      .patch(`/posts/${postId}/finalize`)
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('Finalized')
  })

  it('devuelve 400 si el post no está en estado Paused', async () => {
    await prisma.post.update({ where: { id: postId }, data: { status: 'Active' } })

    const res = await request(app)
      .patch(`/posts/${postId}/finalize`)
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(400)
  })

  it('devuelve 403 si el post pertenece a otro usuario', async () => {
    const otroUsuario = await prisma.user.create({
      data: { email: 'otro@test.com', name: 'Otro', password: 'hashed' },
    })
    const postAjeno = await prisma.post.create({
      data: {
        userId: otroUsuario.id,
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
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(403)
  })

  it('devuelve 404 si el post no existe', async () => {
    const res = await request(app)
      .patch('/posts/id-que-no-existe/finalize')
      .set('Authorization', 'Bearer test-auth0-token')

    expect(res.status).toBe(404)
  })

  it('devuelve 401 sin token', async () => {
    const res = await request(app).patch(`/posts/${postId}/finalize`)

    expect(res.status).toBe(401)
  })
})
