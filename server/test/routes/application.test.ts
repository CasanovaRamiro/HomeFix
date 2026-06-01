import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { cleanDb, createUser, createCategory, prisma } from '../helpers/db.js'
import { app } from '../../src/index.js'

let clientToken: string
let workerToken: string
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
  clientToken = jwt.sign({ sub: clientId }, 'test-secret')
  workerToken = jwt.sign({ sub: workerId }, 'test-secret')
})

const createActivePost = () =>
  prisma.post.create({
    data: {
      userId: clientId,
      title: 'Reparación de caño',
      description: 'Test',
      address: 'Calle 123',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-15'),
      status: 'Active',
      categories: { create: { categoryId } },
    },
  })

const createPendingApplication = (postId: string) =>
  prisma.application.create({
    data: { workerId, postId, status: 'Pending' },
  })

describe('PATCH /applications/:applicationId/accept', () => {
  it('acepta la aplicación y cambia el post a In progress', async () => {
    const post = await createActivePost()
    const application = await createPendingApplication(post.id)

    const res = await request(app)
      .patch(`/applications/${application.id}/accept`)
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('Accepted')

    const updatedPost = await prisma.post.findUnique({ where: { id: post.id } })
    expect(updatedPost!.status).toBe('In progress')
  })

  it('rechaza automáticamente las otras aplicaciones pendientes', async () => {
    const post = await createActivePost()
    const otherWorker = await createUser('other@test.com', 'Other', 'hashed', { role: 'worker' })
    const application = await createPendingApplication(post.id)
    const otherApplication = await prisma.application.create({
      data: { workerId: otherWorker.id, postId: post.id, status: 'Pending' },
    })

    await request(app)
      .patch(`/applications/${application.id}/accept`)
      .set('Authorization', `Bearer ${clientToken}`)

    const rejected = await prisma.application.findUnique({ where: { id: otherApplication.id } })
    expect(rejected!.status).toBe('Rejected')
  })

  it('retorna 404 si la aplicación no existe', async () => {
    const res = await request(app)
      .patch('/applications/id-inexistente/accept')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(404)
  })

  it('retorna 403 si el usuario no es dueño del post', async () => {
    const post = await createActivePost()
    const application = await createPendingApplication(post.id)

    const res = await request(app)
      .patch(`/applications/${application.id}/accept`)
      .set('Authorization', `Bearer ${workerToken}`)

    expect(res.status).toBe(403)
  })

  it('retorna 400 si la aplicación no está en estado Pending', async () => {
    const post = await createActivePost()
    const application = await prisma.application.create({
      data: { workerId, postId: post.id, status: 'Rejected' },
    })

    const res = await request(app)
      .patch(`/applications/${application.id}/accept`)
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(400)
  })

  it('retorna 400 si el post no está Active', async () => {
    const post = await prisma.post.create({
      data: {
        userId: clientId,
        title: 'Post en progreso',
        description: 'Test',
        address: 'Calle 123',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'In progress',
        categories: { create: { categoryId } },
      },
    })
    const application = await createPendingApplication(post.id)

    const res = await request(app)
      .patch(`/applications/${application.id}/accept`)
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(400)
  })

  it('retorna 403 cuando el token no corresponde al dueño del post', async () => {
    const post = await createActivePost()
    const application = await createPendingApplication(post.id)
    const otroCliente = await createUser('otro@test.com', 'Otro', 'hashed', { role: 'client' })
    const otroToken = jwt.sign({ sub: otroCliente.id }, 'test-secret')

    const res = await request(app)
      .patch(`/applications/${application.id}/accept`)
      .set('Authorization', `Bearer ${otroToken}`)

    expect(res.status).toBe(403)
  })
})
