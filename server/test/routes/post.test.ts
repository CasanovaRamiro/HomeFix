import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { cleanDb, createUser, createCategory, prisma } from '../helpers/db.js'
import { PostInput } from '../../src/types/postInput.js'

vi.mock('../../src/middleware/auth0.middleware.js', async () => {
  const mock = await import('../helpers/auth0Mock.js')
  return { jwtCheck: mock.jwtCheck }
})

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
