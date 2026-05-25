import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { cleanDb, createUser, createCategory } from '../helpers/db.js'
import { PostInput } from '../../src/types/postInput.js'

vi.mock('../../src/middleware/auth0.middleware.js', async () => {
  const mock = await import('../helpers/auth0Mock.js')
  return { jwtCheck: mock.jwtCheck }
})

import { app } from '../../src/index.js'

let token: string
let userId: number
let categoryId: number

beforeEach(async () => {
  await cleanDb()
  const user = await createUser('test@test.com', 'Test', 'hashed')
  const category = await createCategory('Test Category')
  userId = user.id
  categoryId = category.id
  token = 'test-auth0-token'
})

const createValidPost = (): PostInput => ({
  userId,
  description: 'Test description',
  startDate: new Date('2026-06-01T00:00:00.000Z'),
  endDate: new Date('2026-06-15T00:00:00.000Z'),
  address: '123 Test St',
  categoryId,
  title: 'Test Post',
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
