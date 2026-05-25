import { describe, it, expect, beforeEach } from 'vitest'
import { cleanDb, prisma } from '../helpers/db.js'
import { findWorkerById, findAllWorkers } from '../../src/data/worker.data.js'

beforeEach(() => cleanDb())

describe('findWorkerById', () => {
  it('returns the worker when id and role match', async () => {
    const created = await prisma.user.create({
      data: { name: 'Ana', email: 'ana@test.com', password: 'hashed', role: 'worker' },
    })

    const worker = await findWorkerById(created.id)

    expect(worker).not.toBeNull()
    expect(worker!.role).toBe('worker')
    expect(worker!.email).toBe('ana@test.com')
  })

  it('returns null when the user exists but is not a worker', async () => {
    const created = await prisma.user.create({
      data: { name: 'Bob', email: 'bob@test.com', password: 'hashed', role: 'user' },
    })

    const worker = await findWorkerById(created.id)

    expect(worker).toBeNull()
  })

  it('returns null when the id does not exist', async () => {
    const worker = await findWorkerById(9999)
    expect(worker).toBeNull()
  })

  it('does not expose the password field', async () => {
    const created = await prisma.user.create({
      data: { name: 'Ana', email: 'ana2@test.com', password: 'hashed', role: 'worker' },
    })

    const worker = await findWorkerById(created.id)

    expect(worker).not.toHaveProperty('password')
  })
})

describe('findAllWorkers', () => {
  it('returns only users with role worker', async () => {
    await prisma.user.createMany({
      data: [
        { name: 'Ana', email: 'ana@test.com', password: 'hashed', role: 'worker' },
        { name: 'Bob', email: 'bob@test.com', password: 'hashed', role: 'worker' },
        { name: 'Carlos', email: 'carlos@test.com', password: 'hashed', role: 'user' },
      ],
    })

    const workers = await findAllWorkers()

    expect(workers).toHaveLength(2)
    workers.forEach((w) => expect(w.role).toBe('worker'))
  })

  it('returns an empty array when there are no workers', async () => {
    await prisma.user.create({
      data: { name: 'Bob', email: 'bob@test.com', password: 'hashed', role: 'user' },
    })

    const workers = await findAllWorkers()

    expect(workers).toHaveLength(0)
  })

  it('does not expose the password field', async () => {
    await prisma.user.create({
      data: { name: 'Ana', email: 'ana@test.com', password: 'hashed', role: 'worker' },
    })

    const workers = await findAllWorkers()

    workers.forEach((w) => expect(w).not.toHaveProperty('password'))
  })
})
