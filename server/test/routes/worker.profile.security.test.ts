import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import type { Prisma } from '@prisma/client'
import type { WorkerResult } from '../../src/infrastructure/database/worker.database.js'
import type { UpdateWorkerInput } from '../../src/domain/types/worker.types.js'

const db = vi.hoisted(() => ({
  update: vi.fn<(args: Prisma.UserUpdateArgs) => Promise<WorkerResult>>(),
  findFirst: vi.fn<(args: Prisma.UserFindFirstArgs) => Promise<WorkerResult | null>>(),
}))

// Exercise the real router, service, persistence mapping and error handler.
// Identity and I/O are fixtures: no Auth0, database or file deletion is needed.
vi.mock('../../src/lib/prisma.js', () => ({ default: { user: db } }))
vi.mock('../../src/domain/services/auth.service.js', () => ({ syncAuth0User: vi.fn() }))
vi.mock('../../src/infrastructure/providers/cloudinary.provider.js', () => ({ deleteImage: vi.fn() }))
vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import workerRoutes from '../../src/presentation/routes/worker.routes.js'
import { errorHandler } from '../../src/presentation/middleware/error.middleware.js'
import { syncAuth0User } from '../../src/domain/services/auth.service.js'
import { deleteImage } from '../../src/infrastructure/providers/cloudinary.provider.js'
import { updateWorker } from '../../src/infrastructure/database/worker.database.js'
import { jwtCheck } from '../helpers/auth0Mock.js'

const app = express()
app.use(express.json())
app.use('/workers', jwtCheck, workerRoutes)
app.use(errorHandler)

const storedWorker: WorkerResult = {
  id: 'worker-1',
  name: 'Ana',
  email: 'ana@homefix.test',
  phone: null,
  bio: null,
  role: 'worker',
  photo: 'https://res.cloudinary.com/demo/image/upload/v123/old.jpg',
  matriculaUrl: null,
  availability: null,
  certificates: null,
  gallery: null,
  emergenciesEnabled: false,
  createdAt: new Date('2026-01-01'),
  kycStatus: 'NOT_STARTED',
  address: { street: 'Test street', number: '123', city: 'Test city', state: 'Test state' },
  categories: [],
}

beforeEach(() => {
  vi.resetAllMocks()
  db.update.mockResolvedValue(storedWorker)
  db.findFirst.mockResolvedValue(storedWorker)
  vi.mocked(syncAuth0User).mockResolvedValue({ id: 'worker-1', role: 'worker' } as never)
  vi.mocked(deleteImage).mockResolvedValue(undefined)
})

const forbiddenFields = [
  ['role', 'client'],
  ['kycStatus', 'APPROVED'],
  ['diditVerificationId', 'forged-session'],
  ['kycVerifiedAt', '2026-01-01T00:00:00Z'],
  ['id', 'other-id'],
  ['email', 'other@homefix.test'],
  ['password', 'changed'],
  ['active', false],
  ['deleted', true],
  ['createdAt', '2000-01-01T00:00:00Z'],
  ['addressId', 'other-address'],
  ['address', { update: { city: 'Changed' } }],
  ['categories', { deleteMany: {} }],
  ['posts', { deleteMany: {} }],
  ['telegramChatId', 'other-chat'],
  ['requiresStartToken', false],
  ['unknownField', 'value'],
  ['constructor', { prototype: { role: 'client' } }],
] as const

describe('PATCH /workers/:id profile security', () => {
  it.each(forbiddenFields)('rejects the non-editable field %s without changing the profile', async (field, value) => {
    const res = await request(app).patch('/workers/worker-1')
      .set('Authorization', 'Bearer test-token')
      .send({ bio: 'Otherwise valid edit', photo: null, [field]: value })

    expect(res.status).toBe(400)
    expect(db.update).not.toHaveBeenCalled()
    expect(db.findFirst).not.toHaveBeenCalled()
    expect(deleteImage).not.toHaveBeenCalled()
  })

  it('rejects prototype properties supplied in JSON', async () => {
    const res = await request(app).patch('/workers/worker-1')
      .set('Authorization', 'Bearer test-token').set('Content-Type', 'application/json')
      .send('{"bio":"Valid edit","__proto__":{"role":"client"}}')

    expect(res.status).toBe(400)
    expect(db.update).not.toHaveBeenCalled()
  })

  it.each([
    { name: 123 }, { name: null }, { name: '  ' },
    { name: { set: 'Ana' } }, { phone: 123 }, { bio: false },
    { photo: [] }, { matriculaUrl: {} }, { emergenciesEnabled: 'true' },
    { categoryIds: null }, { categoryIds: 'category-1' }, { categoryIds: [1] }, { categoryIds: [' '] },
    { availability: {} }, { availability: [null] },
    { certificates: {} }, { certificates: [null] },
    { certificates: [{ id: 'cert-1', imageUrl: 'https://example.com/cert.jpg' }] },
    { certificates: [{ id: 'cert-1', title: 'Training', imageUrl: 'url', issuer: 123 }] },
    { certificates: [{ id: 'cert-1', title: 'Training', imageUrl: 'url', verified: true }] },
    { gallery: '[]' }, { gallery: [null] }, { gallery: [{ id: 'img-1' }] },
    { gallery: [{ id: 'img-1', imageUrl: 'url', caption: false }] },
    { gallery: [{ id: 'img-1', imageUrl: 'url', userId: 'other-user' }] },
    ['not-an-object'],
  ])('rejects invalid profile types: %j', async (body) => {
    const res = await request(app).patch('/workers/worker-1')
      .set('Authorization', 'Bearer test-token').send(body)

    expect(res.status).toBe(400)
    expect(db.update).not.toHaveBeenCalled()
    expect(deleteImage).not.toHaveBeenCalled()
  })

  it('rejects an absent body', async () => {
    const res = await request(app).patch('/workers/worker-1').set('Authorization', 'Bearer test-token')
    expect(res.status).toBe(400)
    expect(db.update).not.toHaveBeenCalled()
  })

  it('preserves all supported profile fields and their persistence mapping', async () => {
    const input: UpdateWorkerInput = {
      name: 'Ana Updated', phone: '123456', bio: 'Electricista',
      photo: storedWorker.photo, matriculaUrl: 'https://example.com/matricula.pdf',
      categoryIds: ['category-1'], availability: ['monday'], emergenciesEnabled: true,
      certificates: [{ id: 'cert-1', title: 'Training', issuer: null, imageUrl: 'https://example.com/cert.jpg' }],
      gallery: [{ id: 'img-1', imageUrl: 'https://example.com/photo.jpg', caption: 'Work' }],
    }

    const res = await request(app).patch('/workers/worker-1')
      .set('Authorization', 'Bearer test-token').send(input)

    expect(res.status).toBe(200)
    expect(db.update).toHaveBeenCalledOnce()
    expect(db.update.mock.calls[0]?.[0].where).toEqual({ id: 'worker-1' })
    const { certificates, gallery, ...data } = db.update.mock.calls[0][0].data
    expect(data).toEqual({
      name: input.name, phone: input.phone, bio: input.bio,
      photo: input.photo, matriculaUrl: input.matriculaUrl, emergenciesEnabled: true,
      availability: JSON.stringify(input.availability),
      categories: { deleteMany: {}, create: [{ categoryId: 'category-1' }] },
    })
    if (typeof certificates !== 'string' || typeof gallery !== 'string') {
      throw new Error('Expected serialized certificates and gallery')
    }
    const savedCertificates: unknown = JSON.parse(certificates)
    const savedGallery: unknown = JSON.parse(gallery)
    expect(savedCertificates).toEqual(input.certificates)
    expect(savedGallery).toEqual(input.gallery)
    expect(deleteImage).not.toHaveBeenCalled()
  })

  it('allows nullable fields to be cleared and collections to be emptied', async () => {
    const res = await request(app).patch('/workers/worker-1').set('Authorization', 'Bearer test-token')
      .send({ phone: null, bio: null, photo: null, matriculaUrl: null, emergenciesEnabled: false,
        categoryIds: [], availability: [], certificates: [], gallery: [] })

    expect(res.status).toBe(200)
    expect(db.update).toHaveBeenCalledOnce()
    expect(db.update.mock.calls[0]?.[0].data).toMatchObject({
      phone: null, bio: null, photo: null, matriculaUrl: null, emergenciesEnabled: false,
      availability: '[]', certificates: '[]', gallery: '[]', categories: { deleteMany: {}, create: [] },
    })
  })

  it('returns 401 without authentication', async () => {
    const res = await request(app).patch('/workers/worker-1').send({ bio: 'Edit' })
    expect(res.status).toBe(401)
    expect(db.update).not.toHaveBeenCalled()
  })

  it('returns 403 when trying to edit another worker', async () => {
    const res = await request(app).patch('/workers/other-worker')
      .set('Authorization', 'Bearer test-token').send({ bio: 'Edit' })
    expect(res.status).toBe(403)
    expect(db.update).not.toHaveBeenCalled()
  })
})

it('never passes extra fields to Prisma even when persistence is called directly', async () => {
  const input = {
    bio: 'Valid bio', role: 'client', kycStatus: 'APPROVED', diditVerificationId: 'forged-session',
    id: 'other-worker', categories: { deleteMany: {} }, address: { delete: true },
  }

  await updateWorker('worker-1', input)

  expect(db.update).toHaveBeenCalledOnce()
  expect(db.update.mock.calls[0]?.[0].where).toEqual({ id: 'worker-1' })
  expect(db.update.mock.calls[0]?.[0].data).toEqual({ bio: 'Valid bio' })
})
