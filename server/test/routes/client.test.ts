import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import { cleanDb, createUser, createCategory, prisma } from '../helpers/db.js'

const { getPayload, setPayload } = vi.hoisted(() => {
  const payloads: Record<string, Record<string, string>> = {}
  return {
    getPayload: (token: string) => payloads[token],
    setPayload: (token: string, payload: Record<string, string>) => { payloads[token] = payload },
  }
})

vi.mock('../../src/presentation/middleware/auth0.middleware.js', () => ({
  jwtCheck: (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const payload = getPayload(header.split(' ')[1])
    if (!payload) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    ;(req as Request & { auth?: unknown }).auth = { header: {}, token: '', payload }
    next()
  },
}))

import { app } from '../../src/index.js'

let clientToken: string
let clientId: string
let workerId: string
let categoryId: string

beforeEach(async () => {
  await cleanDb()
  const client = await createUser('client@test.com', 'Client', 'hashed', { role: 'client' })
  const worker = await createUser('worker@test.com', 'Worker', 'hashed', { role: 'worker' })
  const category = await createCategory('Test Category')
  clientId = client.id
  workerId = worker.id
  categoryId = category.id
  clientToken = 'client-token'
  setPayload('client-token', { sub: clientId, email: 'client@test.com', role: 'client' })
})

const createPost = (userId: string, status: string, overrides: Record<string, unknown> = {}) =>
  prisma.post.create({
    data: {
      userId,
      title: 'Test Post',
      description: 'Description',
      address: 'Calle 123',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-15'),
      status,
      categories: { create: { categoryId } },
      ...overrides,
    },
  })

const createApplication = (postId: string, status: string) =>
  prisma.application.create({
    data: { workerId, postId, status },
  })

const createWorkerReview = (applicationId: string, rating: number) =>
  prisma.workerReview.create({
    data: {
      applicationId,
      reviewerId: clientId,
      workerId,
      description: 'Good job',
      rating,
    },
  })

const createClientReview = (applicationId: string, rating: number) =>
  prisma.clientReview.create({
    data: {
      applicationId,
      reviewerId: workerId,
      clientId,
      description: 'Good client',
      rating,
    },
  })

// ─── GET /client/stats ────────────────────────────────────────────────────────

describe('GET /client/stats', () => {
  it('retorna 401 sin token', async () => {
    const res = await request(app).get('/client/stats')
    expect(res.status).toBe(401)
  })

  it('retorna stats en cero cuando no hay publicaciones', async () => {
    const res = await request(app)
      .get('/client/stats')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      completedPosts: 0,
      cancelledPosts: 0,
      unreviewedJobs: 0,
      clientRating: { averageRating: 0, reviewCount: 0 },
    })
  })

  it('cuenta publicaciones completadas y canceladas', async () => {
    await createPost(clientId, 'Completed')
    await createPost(clientId, 'Completed')
    await createPost(clientId, 'Cancelled')

    const res = await request(app)
      .get('/client/stats')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(200)
    expect(res.body.completedPosts).toBe(2)
    expect(res.body.cancelledPosts).toBe(1)
  })

  it('cuenta unreviewedJobs solo para post completados sin WorkerReview', async () => {
    const postWithoutReview = await createPost(clientId, 'Completed')
    const appWithoutReview = await createApplication(postWithoutReview.id, 'Accepted')

    const postWithReview = await createPost(clientId, 'Completed')
    const appWithReview = await createApplication(postWithReview.id, 'Accepted')
    await createWorkerReview(appWithReview.id, 5)

    const res = await request(app)
      .get('/client/stats')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(200)
    expect(res.body.completedPosts).toBe(2)
    expect(res.body.unreviewedJobs).toBe(1)
  })

  it('retorna el promedio de rating como cliente', async () => {
    const post = await createPost(clientId, 'Completed')
    const app1 = await createApplication(post.id, 'Completed')
    await createClientReview(app1.id, 3)

    const post2 = await createPost(clientId, 'Completed')
    const app2 = await createApplication(post2.id, 'Completed')
    await createClientReview(app2.id, 5)

    const res = await request(app)
      .get('/client/stats')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(200)
    expect(res.body.clientRating.averageRating).toBe(4)
    expect(res.body.clientRating.reviewCount).toBe(2)
  })

  it('solo considera posts del cliente autenticado', async () => {
    await createPost(clientId, 'Completed')

    const otherClient = await createUser('other@test.com', 'Other', 'hashed', { role: 'client' })
    setPayload('other-token', { sub: otherClient.id, email: 'other@test.com', role: 'client' })
    await createPost(otherClient.id, 'Completed')

    const res = await request(app)
      .get('/client/stats')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.body.completedPosts).toBe(1)
  })
})

// ─── GET /client/posts ────────────────────────────────────────────────────────

describe('GET /client/posts', () => {
  it('retorna 401 sin token', async () => {
    const res = await request(app).get('/client/posts')
    expect(res.status).toBe(401)
  })

  it('retorna lista vacía cuando no hay publicaciones', async () => {
    const res = await request(app)
      .get('/client/posts')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ data: [], total: 0, page: 1, limit: 10 })
  })

  it('retorna solo posts Completed y Cancelled (excluye Active)', async () => {
    await createPost(clientId, 'Active')
    await createPost(clientId, 'Completed')
    await createPost(clientId, 'Cancelled')

    const res = await request(app)
      .get('/client/posts')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.body.data).toHaveLength(2)
    expect(res.body.data.map((p: { status: string }) => p.status).sort())
      .toEqual(['Cancelled', 'Completed'])
  })

  it('incluye posts Cancelled sin aplicaciones aceptadas', async () => {
    await createPost(clientId, 'Cancelled')

    const res = await request(app)
      .get('/client/posts')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].status).toBe('Cancelled')
  })

  it('devuelve hasReview true cuando existe WorkerReview', async () => {
    const post = await createPost(clientId, 'Completed')
    const application = await createApplication(post.id, 'Accepted')
    await createWorkerReview(application.id, 4)

    const res = await request(app)
      .get('/client/posts')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.body.data[0].hasReview).toBe(true)
  })

  it('devuelve hasReview false cuando no hay WorkerReview', async () => {
    const post = await createPost(clientId, 'Completed')
    await createApplication(post.id, 'Accepted')

    const res = await request(app)
      .get('/client/posts')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.body.data[0].hasReview).toBe(false)
  })

  it('paginacion: page y limit por defecto', async () => {
    for (let i = 0; i < 3; i++) {
      await createPost(clientId, 'Completed')
    }

    const res = await request(app)
      .get('/client/posts')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.body.data).toHaveLength(3)
    expect(res.body.total).toBe(3)
    expect(res.body.page).toBe(1)
    expect(res.body.limit).toBe(10)
  })

  it('paginacion: respeta page y limit', async () => {
    for (let i = 0; i < 5; i++) {
      await createPost(clientId, 'Completed')
    }

    const res = await request(app)
      .get('/client/posts?page=2&limit=2')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.body.data).toHaveLength(2)
    expect(res.body.total).toBe(5)
    expect(res.body.page).toBe(2)
    expect(res.body.limit).toBe(2)
  })

  it('paginacion: page mas alla del total devuelve array vacio', async () => {
    await createPost(clientId, 'Completed')

    const res = await request(app)
      .get('/client/posts?page=999&limit=10')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.body.data).toHaveLength(0)
    expect(res.body.total).toBe(1)
  })

  it('solo devuelve posts del usuario autenticado', async () => {
    await createPost(clientId, 'Completed')

    const otherClient = await createUser('other@test.com', 'Other', 'hashed', { role: 'client' })
    setPayload('other-token', { sub: otherClient.id, email: 'other@test.com', role: 'client' })
    await createPost(otherClient.id, 'Completed')

    const res = await request(app)
      .get('/client/posts')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.body.data).toHaveLength(1)
    expect(res.body.total).toBe(1)
  })
})
