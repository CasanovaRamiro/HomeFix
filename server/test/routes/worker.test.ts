import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../../src/index.js'
import { cleanDb, prisma } from '../helpers/db.js'
import { getTestToken } from '../helpers/auth.js'

let token: string

beforeEach(async () => {
  await cleanDb()
  const user = await prisma.user.create({
    data: { name: 'Regular User', email: 'user@test.com', password: 'hashed', role: 'user' },
  })
  token = getTestToken(user.id)
})

describe('GET /workers', () => {
  it('returns all workers when authenticated', async () => {
    await prisma.user.createMany({
      data: [
        { name: 'Ana', email: 'ana@test.com', password: 'hashed', role: 'worker' },
        { name: 'Bob', email: 'bob@test.com', password: 'hashed', role: 'worker' },
      ],
    })

    const res = await request(app)
      .get('/workers')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    res.body.forEach((w: { role: string }) => expect(w.role).toBe('worker'))
  })

  it('does not return non-worker users', async () => {
    await prisma.user.create({
      data: { name: 'Ana', email: 'ana@test.com', password: 'hashed', role: 'worker' },
    })

    const res = await request(app)
      .get('/workers')
      .set('Authorization', `Bearer ${token}`)

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
      data: { name: 'Ana', email: 'ana@test.com', password: 'hashed', role: 'worker' },
    })

    const res = await request(app)
      .get(`/workers/${worker.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.email).toBe('ana@test.com')
    expect(res.body.role).toBe('worker')
    expect(res.body).not.toHaveProperty('password')
    expect(res.body).toHaveProperty('categories')
    expect(Array.isArray(res.body.categories)).toBe(true)
    expect(res.body).toHaveProperty('bio')
  })

  it('returns the categories assigned to the worker', async () => {
    const worker = await prisma.user.create({
      data: { name: 'Ana', email: 'ana@test.com', password: 'hashed', role: 'worker' },
    })
    const category = await prisma.category.create({ data: { name: 'Plumbing' } })
    await prisma.userCategory.create({
      data: { userId: worker.id, categoryId: category.id },
    })

    const res = await request(app)
      .get(`/workers/${worker.id}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.categories).toHaveLength(1)
    expect(res.body.categories[0].category.name).toBe('Plumbing')
  })

  it('returns 400 when id is not a number', async () => {
    const res = await request(app)
      .get('/workers/abc')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
  })

  it('returns 404 when the worker does not exist', async () => {
    const res = await request(app)
      .get('/workers/9999')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/workers/1')
    expect(res.status).toBe(401)
  })
})
