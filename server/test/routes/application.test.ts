import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import request from 'supertest'
import { cleanDb, createUser, createCategory, prisma } from '../helpers/db.js'
import { UserRole } from '../../src/domain/types/userRole.js'
import { PostType } from '../../src/domain/types/postType.js'

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
let workerToken: string
let clientId: string
let workerId: string
let categoryId: string

beforeEach(async () => {
  await cleanDb()
  const client = await createUser('client@test.com', 'Client', 'hashed', { role: UserRole.Client })
  const worker = await createUser('worker@test.com', 'Worker', 'hashed', { role: UserRole.Worker })
  const category = await createCategory('Test Category')
  clientId = client.id
  workerId = worker.id
  categoryId = category.id
  clientToken = 'client-token'
  workerToken = 'worker-token'
  setPayload('client-token', { sub: clientId, email: 'client@test.com', role: UserRole.Client })
  setPayload('worker-token', { sub: workerId, email: 'worker@test.com', role: UserRole.Worker })
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

const validApplicationBody = (postId: string) => ({
  postId,
  availableDays: ['Lunes', 'Martes'],
  availableTimeFrom: '09:00',
  availableTimeTo: '18:00',
  chargesVisit: false,
})

describe('POST /applications', () => {
  it('crea una postulación con los campos de disponibilidad y retorna 201', async () => {
    const post = await createActivePost()
    const res = await request(app)
      .post('/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send(validApplicationBody(post.id))

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.status).toBe('Pending')
    expect(res.body.message).toBe('Application successful')
  })

  it('persiste todos los campos de disponibilidad y visita en la base de datos', async () => {
    const post = await createActivePost()
    const res = await request(app)
      .post('/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        ...validApplicationBody(post.id),
        message: 'Puedo ir mañana a las 10',
        chargesVisit: true,
        visitCost: 500,
      })

    expect(res.status).toBe(201)
    const saved = await prisma.application.findUnique({ where: { id: res.body.id } })
    expect(saved?.message).toBe('Puedo ir mañana a las 10')
    expect(saved?.availableDays).toBe(JSON.stringify(['Lunes', 'Martes']))
    expect(saved?.availableTimeFrom).toBe('09:00')
    expect(saved?.availableTimeTo).toBe('18:00')
    expect(saved?.chargesVisit).toBe(true)
    expect(saved?.visitCost).toBe(500)
  })

  it('retorna 400 si falta availableDays', async () => {
    const post = await createActivePost()
    const res = await request(app)
      .post('/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ postId: post.id, availableTimeFrom: '09:00', availableTimeTo: '18:00', chargesVisit: false })

    expect(res.status).toBe(400)
  })

  it('retorna 400 si availableDays es array vacío', async () => {
    const post = await createActivePost()
    const res = await request(app)
      .post('/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ ...validApplicationBody(post.id), availableDays: [] })

    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta availableTimeFrom', async () => {
    const post = await createActivePost()
    const res = await request(app)
      .post('/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ postId: post.id, availableDays: ['Lunes'], availableTimeTo: '18:00', chargesVisit: false })

    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta availableTimeTo', async () => {
    const post = await createActivePost()
    const res = await request(app)
      .post('/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ postId: post.id, availableDays: ['Lunes'], availableTimeFrom: '09:00', chargesVisit: false })

    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta chargesVisit', async () => {
    const post = await createActivePost()
    const res = await request(app)
      .post('/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ postId: post.id, availableDays: ['Lunes'], availableTimeFrom: '09:00', availableTimeTo: '18:00' })

    expect(res.status).toBe(400)
  })

  it('retorna 400 si chargesVisit es true pero no se envía visitCost', async () => {
    const post = await createActivePost()
    const res = await request(app)
      .post('/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ ...validApplicationBody(post.id), chargesVisit: true })

    expect(res.status).toBe(400)
  })

  it('retorna 409 si el worker ya se postuló al mismo post', async () => {
    const post = await createActivePost()
    await request(app)
      .post('/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send(validApplicationBody(post.id))

    const res = await request(app)
      .post('/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send(validApplicationBody(post.id))

    expect(res.status).toBe(409)
  })

  it('retorna 401 si no se envía token', async () => {
    const post = await createActivePost()
    const res = await request(app)
      .post('/applications')
      .send(validApplicationBody(post.id))

    expect(res.status).toBe(401)
  })

  it('retorna 404 si el post no existe', async () => {
    const res = await request(app)
      .post('/applications')
      .set('Authorization', `Bearer ${workerToken}`)
      .send(validApplicationBody('post-inexistente'))

    expect(res.status).toBe(404)
  })
})

describe('POST /applications/subcontract', () => {
  const createActiveSubcontract = (overrides: Record<string, unknown> = {}) =>
    prisma.post.create({
      data: {
        userId: clientId,
        title: 'Busco albañil',
        description: 'Necesito un albañil para terminar un baño',
        address: 'Calle 456',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'Active',
        type: 'subcontract',
        categories: {
          create: { categoryId, quantity: 2, filledCount: 0, roleDescription: 'Albañilería general' },
        },
        ...overrides,
      },
    })

  it('crea una postulación a subcontract y retorna 201', async () => {
    const subcontract = await createActiveSubcontract()
    const res = await request(app)
      .post('/applications/subcontract')
      .set('Authorization', `Bearer ${workerToken}`)
      .send(validApplicationBody(subcontract.id))

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.status).toBe('Pending')
    expect(res.body.message).toBe('Postulación a subcontrato exitosa')
  })

  it('persiste los campos en la base de datos', async () => {
    const subcontract = await createActiveSubcontract()
    const res = await request(app)
      .post('/applications/subcontract')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({
        ...validApplicationBody(subcontract.id),
        message: 'Tengo experiencia en albañilería',
        chargesVisit: true,
        visitCost: 300,
      })

    expect(res.status).toBe(201)
    const saved = await prisma.application.findUnique({ where: { id: res.body.id } })
    expect(saved?.message).toBe('Tengo experiencia en albañilería')
    expect(saved?.chargesVisit).toBe(true)
    expect(saved?.visitCost).toBe(300)
  })

  it('retorna 400 si el postId corresponde a un post regular', async () => {
    const post = await createActivePost()
    const res = await request(app)
      .post('/applications/subcontract')
      .set('Authorization', `Bearer ${workerToken}`)
      .send(validApplicationBody(post.id))

    expect(res.status).toBe(400)
  })

  it('retorna 400 si el worker se postula a su propio subcontract', async () => {
    const subcontract = await createActiveSubcontract({ userId: workerId })
    const res = await request(app)
      .post('/applications/subcontract')
      .set('Authorization', `Bearer ${workerToken}`)
      .send(validApplicationBody(subcontract.id))

    expect(res.status).toBe(400)
  })

  it('retorna 400 si no hay vacantes disponibles', async () => {
    const subcontract = await prisma.post.create({
      data: {
        userId: clientId,
        title: 'Busco albañil',
        description: 'Test',
        address: 'Calle 456',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'Active',
        type: 'subcontract',
        categories: {
          create: { categoryId, quantity: 2, filledCount: 2, roleDescription: 'Albañilería general' },
        },
      },
    })
    const res = await request(app)
      .post('/applications/subcontract')
      .set('Authorization', `Bearer ${workerToken}`)
      .send(validApplicationBody(subcontract.id))

    expect(res.status).toBe(400)
  })

  it('retorna 400 si el subcontract no está Active', async () => {
    const subcontract = await createActiveSubcontract({ status: 'Completed' })
    const res = await request(app)
      .post('/applications/subcontract')
      .set('Authorization', `Bearer ${workerToken}`)
      .send(validApplicationBody(subcontract.id))

    expect(res.status).toBe(400)
  })

  it('retorna 409 si el worker ya se postuló al subcontract', async () => {
    const subcontract = await createActiveSubcontract()
    await request(app)
      .post('/applications/subcontract')
      .set('Authorization', `Bearer ${workerToken}`)
      .send(validApplicationBody(subcontract.id))

    const res = await request(app)
      .post('/applications/subcontract')
      .set('Authorization', `Bearer ${workerToken}`)
      .send(validApplicationBody(subcontract.id))

    expect(res.status).toBe(409)
  })

  it('retorna 400 si falta postId', async () => {
    const res = await request(app)
      .post('/applications/subcontract')
      .set('Authorization', `Bearer ${workerToken}`)
      .send({ availableDays: ['Lunes'], availableTimeFrom: '09:00', availableTimeTo: '18:00', chargesVisit: false })

    expect(res.status).toBe(400)
  })

  it('retorna 401 si no se envía token', async () => {
    const subcontract = await createActiveSubcontract()
    const res = await request(app)
      .post('/applications/subcontract')
      .send(validApplicationBody(subcontract.id))

    expect(res.status).toBe(401)
  })
})

describe('GET /applications/my-applications', () => {
  it('no devuelve aplicaciones rechazadas', async () => {
    const post = await createActivePost()
    await prisma.application.create({
      data: { workerId, postId: post.id, status: 'Rejected' },
    })

    const res = await request(app)
      .get('/applications/my-applications')
      .set('Authorization', `Bearer ${workerToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(0)
  })

  it('devuelve aplicaciones Pending y Accepted', async () => {
    const post1 = await createActivePost()
    const post2 = await prisma.post.create({
      data: {
        userId: clientId,
        title: 'Otro post',
        description: 'Test',
        address: 'Calle 456',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'In progress',
        categories: { create: { categoryId } },
      },
    })
    await prisma.application.create({ data: { workerId, postId: post1.id, status: 'Pending' } })
    await prisma.application.create({ data: { workerId, postId: post2.id, status: 'Accepted' } })

    const res = await request(app)
      .get('/applications/my-applications')
      .set('Authorization', `Bearer ${workerToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0]).toHaveProperty('clientRating', 0)
    expect(res.body[1]).toHaveProperty('clientRating', 0)
  })
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

  it('no rechaza otras aplicaciones pendientes al aceptar una', async () => {
    const post = await createActivePost()
    const otherWorker = await createUser('other@test.com', 'Other', 'hashed', { role: UserRole.Worker })
    const application = await createPendingApplication(post.id)
    const otherApplication = await prisma.application.create({
      data: { workerId: otherWorker.id, postId: post.id, status: 'Pending' },
    })

    await request(app)
      .patch(`/applications/${application.id}/accept`)
      .set('Authorization', `Bearer ${clientToken}`)

    const unchanged = await prisma.application.findUnique({ where: { id: otherApplication.id } })
    expect(unchanged!.status).toBe('Pending')
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
    const otroCliente = await createUser('otro@test.com', 'Otro', 'hashed', { role: UserRole.Client })
    setPayload('otro-token', { sub: otroCliente.id, email: 'otro@test.com', role: UserRole.Client })

    const res = await request(app)
      .patch(`/applications/${application.id}/accept`)
      .set('Authorization', 'Bearer otro-token')

    expect(res.status).toBe(403)
  })
})

describe('PATCH /applications/:applicationId/reject', () => {
  it('rechaza la aplicación y el post queda Active', async () => {
    const post = await createActivePost()
    const application = await createPendingApplication(post.id)

    const res = await request(app)
      .patch(`/applications/${application.id}/reject`)
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('Rejected')

    const updatedPost = await prisma.post.findUnique({ where: { id: post.id } })
    expect(updatedPost!.status).toBe('Active')
  })

  it('no afecta otras aplicaciones pendientes del mismo post', async () => {
    const post = await createActivePost()
    const otherWorker = await createUser('other@test.com', 'Other', 'hashed', { role: UserRole.Worker })
    const application = await createPendingApplication(post.id)
    const otherApplication = await prisma.application.create({
      data: { workerId: otherWorker.id, postId: post.id, status: 'Pending' },
    })

    await request(app)
      .patch(`/applications/${application.id}/reject`)
      .set('Authorization', `Bearer ${clientToken}`)

    const untouched = await prisma.application.findUnique({ where: { id: otherApplication.id } })
    expect(untouched!.status).toBe('Pending')
  })

  it('retorna 404 si la aplicación no existe', async () => {
    const res = await request(app)
      .patch('/applications/id-inexistente/reject')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(404)
  })

  it('retorna 403 si el usuario no es dueño del post', async () => {
    const post = await createActivePost()
    const application = await createPendingApplication(post.id)

    const res = await request(app)
      .patch(`/applications/${application.id}/reject`)
      .set('Authorization', `Bearer ${workerToken}`)

    expect(res.status).toBe(403)
  })

  it('retorna 400 si la aplicación no está en estado Pending', async () => {
    const post = await createActivePost()
    const application = await prisma.application.create({
      data: { workerId, postId: post.id, status: 'Accepted' },
    })

    const res = await request(app)
      .patch(`/applications/${application.id}/reject`)
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(400)
  })
})

describe('PATCH /applications/:applicationId/dismiss', () => {
  const createInProgressPost = () =>
    prisma.post.create({
      data: {
        userId: clientId,
        title: 'Trabajo en curso',
        description: 'Test',
        address: 'Calle 123',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'In progress',
        categories: { create: { categoryId } },
      },
    })

  it('despide al trabajador, deja la aplicación Dismissed y reabre el post', async () => {
    const post = await createInProgressPost()
    const application = await prisma.application.create({
      data: { workerId, postId: post.id, status: 'Accepted' },
    })

    const res = await request(app)
      .patch(`/applications/${application.id}/dismiss`)
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('Dismissed')

    const updatedPost = await prisma.post.findUnique({ where: { id: post.id } })
    expect(updatedPost!.status).toBe('Active')
  })

  it('conserva las otras postulaciones pendientes para poder contratar a otro', async () => {
    const post = await createInProgressPost()
    const otherWorker = await createUser('other@test.com', 'Other', 'hashed', { role: UserRole.Worker })
    const accepted = await prisma.application.create({
      data: { workerId, postId: post.id, status: 'Accepted' },
    })
    const pending = await prisma.application.create({
      data: { workerId: otherWorker.id, postId: post.id, status: 'Pending' },
    })

    await request(app)
      .patch(`/applications/${accepted.id}/dismiss`)
      .set('Authorization', `Bearer ${clientToken}`)

    const untouched = await prisma.application.findUnique({ where: { id: pending.id } })
    expect(untouched!.status).toBe('Pending')
  })

  it('retorna 404 si la aplicación no existe', async () => {
    const res = await request(app)
      .patch('/applications/id-inexistente/dismiss')
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(404)
  })

  it('retorna 403 si el usuario no es dueño del post', async () => {
    const post = await createInProgressPost()
    const application = await prisma.application.create({
      data: { workerId, postId: post.id, status: 'Accepted' },
    })

    const res = await request(app)
      .patch(`/applications/${application.id}/dismiss`)
      .set('Authorization', `Bearer ${workerToken}`)

    expect(res.status).toBe(403)
  })

  it('retorna 400 si la aplicación no está Accepted', async () => {
    const post = await createInProgressPost()
    const application = await prisma.application.create({
      data: { workerId, postId: post.id, status: 'Pending' },
    })

    const res = await request(app)
      .patch(`/applications/${application.id}/dismiss`)
      .set('Authorization', `Bearer ${clientToken}`)

    expect(res.status).toBe(400)
  })
})
