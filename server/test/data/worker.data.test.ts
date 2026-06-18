import { describe, it, expect, beforeEach } from 'vitest'
import { cleanDb, prisma, createUser } from '../helpers/db.js'
import { findWorkerById, findAllWorkers, updateWorker } from '../../src/infrastructure/database/worker.database.js'
import { UserRole } from '../../src/domain/types/userRole.js'

beforeEach(() => cleanDb())

const makeWorker = (email: string, name: string, extra: Record<string, unknown> = {}) =>
  createUser(email, name, 'hashed', { role: UserRole.Worker, ...extra })

const makeUser = (email: string, name: string, extra: Record<string, unknown> = {}) =>
  createUser(email, name, 'hashed', { role: 'user', ...extra })

describe('findWorkerById', () => {
  it('returns the worker when id and role match', async () => {
    const created = await makeWorker('ana@test.com', 'Ana')

    const worker = await findWorkerById(created.id)

    expect(worker).not.toBeNull()
    expect(worker!.role).toBe(UserRole.Worker)
    expect(worker!.email).toBe('ana@test.com')
  })

  it('returns null when the user exists but is not a worker', async () => {
    const created = await makeUser('bob@test.com', 'Bob')

    const worker = await findWorkerById(created.id)

    expect(worker).toBeNull()
  })

  it('returns null when the id does not exist', async () => {
    const worker = await findWorkerById('non-existent-id')
    expect(worker).toBeNull()
  })

  it('does not expose the password field', async () => {
    const created = await makeWorker('ana2@test.com', 'Ana')

    const worker = await findWorkerById(created.id)

    expect(worker).not.toHaveProperty('password')
  })

  it('returns categories when the worker has some assigned', async () => {
    const created = await makeWorker('ana@test.com', 'Ana')
    const category = await prisma.category.create({ data: { name: 'Plumbing' } })
    await prisma.userCategory.create({
      data: { userId: created.id, categoryId: category.id },
    })

    const worker = await findWorkerById(created.id)

    expect(worker!.categories).toHaveLength(1)
    expect(worker!.categories[0].name).toBe('Plumbing')
  })

  it('returns an empty categories array when the worker has none', async () => {
    const created = await makeWorker('ana@test.com', 'Ana')

    const worker = await findWorkerById(created.id)

    expect(worker!.categories).toHaveLength(0)
  })

  it('returns bio as null when not set', async () => {
    const created = await makeWorker('ana@test.com', 'Ana')

    const worker = await findWorkerById(created.id)

    expect(worker!.bio).toBeNull()
  })

  it('returns the correct bio when set', async () => {
    const created = await makeWorker('ana@test.com', 'Ana', { bio: 'Experienced plumber.' })

    const worker = await findWorkerById(created.id)

    expect(worker!.bio).toBe('Experienced plumber.')
  })
})

describe('findAllWorkers', () => {
  it('returns only users with role worker', async () => {
    await Promise.all([
      makeWorker('ana@test.com', 'Ana'),
      makeWorker('bob@test.com', 'Bob'),
      makeUser('carlos@test.com', 'Carlos'),
    ])

    const workers = await findAllWorkers()

    expect(workers).toHaveLength(2)
    workers.forEach((w) => expect(w.role).toBe(UserRole.Worker))
  })

  it('returns an empty array when there are no workers', async () => {
    await makeUser('bob@test.com', 'Bob')

    const workers = await findAllWorkers()

    expect(workers).toHaveLength(0)
  })

  it('does not expose the password field', async () => {
    await makeWorker('ana@test.com', 'Ana')

    const workers = await findAllWorkers()

    workers.forEach((w) => expect(w).not.toHaveProperty('password'))
  })

  it('returns categories for each worker', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')
    const category = await prisma.category.create({ data: { name: 'Electrical' } })
    await prisma.userCategory.create({
      data: { userId: worker.id, categoryId: category.id },
    })

    const workers = await findAllWorkers()

    expect(workers[0].categories).toHaveLength(1)
    expect(workers[0].categories[0].name).toBe('Electrical')
  })
})

describe('updateWorker', () => {
  it('updates basic text fields', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')

    const updated = await updateWorker(worker.id, { bio: 'Experienced plumber' })

    expect(updated.bio).toBe('Experienced plumber')
  })

  it('assigns new categories replacing existing ones', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')
    const cat1 = await prisma.category.create({ data: { name: 'Plumbing' } })
    const cat2 = await prisma.category.create({ data: { name: 'Electrical' } })
    await prisma.userCategory.create({ data: { userId: worker.id, categoryId: cat1.id } })

    const updated = await updateWorker(worker.id, { categoryIds: [cat2.id] })

    expect(updated.categories).toHaveLength(1)
    expect(updated.categories[0].name).toBe('Electrical')
  })

  it('persists and returns availability as parsed array', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')
    const availability = ['monday', 'tuesday']

    const updated = await updateWorker(worker.id, { availability })

    expect(updated.availability).toEqual(availability)
  })

  it('persists and returns certificates as parsed array', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')
    const certificates = [{ id: 'cert-1', title: 'Cert A', imageUrl: 'https://example.com/cert.jpg' }]

    const updated = await updateWorker(worker.id, { certificates })

    expect(updated.certificates).toEqual(certificates)
  })

  it('persists and returns gallery as parsed array', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')
    const gallery = [{ id: 'img-1', imageUrl: 'https://img1.com' }, { id: 'img-2', imageUrl: 'https://img2.com' }]

    const updated = await updateWorker(worker.id, { gallery })

    expect(updated.gallery).toEqual(gallery)
  })

  it('does not modify categories when categoryIds is not provided', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')
    const cat = await prisma.category.create({ data: { name: 'Plumbing' } })
    await prisma.userCategory.create({ data: { userId: worker.id, categoryId: cat.id } })

    const updated = await updateWorker(worker.id, { bio: 'New bio' })

    expect(updated.categories).toHaveLength(1)
    expect(updated.bio).toBe('New bio')
  })

  it('can set categories to empty array', async () => {
    const worker = await makeWorker('ana@test.com', 'Ana')
    const cat = await prisma.category.create({ data: { name: 'Plumbing' } })
    await prisma.userCategory.create({ data: { userId: worker.id, categoryId: cat.id } })

    const updated = await updateWorker(worker.id, { categoryIds: [] })

    expect(updated.categories).toHaveLength(0)
  })
})
