import { describe, it, expect, beforeEach } from 'vitest'
import { cleanDb, createUser, prisma } from '../helpers/db.js'
import { findApplicationsByWorker } from '../../src/infrastructure/database/application.database.js'

let workerId: string
let clientId: string

beforeEach(async () => {
  await cleanDb()
  const client = await createUser('client@test.com', 'Client', 'hashed')
  const worker = await createUser('worker@test.com', 'Worker', 'hashed')
  clientId = client.id
  workerId = worker.id
})

const makePost = (userId: string) =>
  prisma.post.create({
    data: {
      userId,
      title: 'Test Post',
      description: 'description',
      address: '123 Test St',
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-06-15T00:00:00.000Z'),
    },
  })

describe('findApplicationsByWorker', () => {
  it('returns a Pending application', async () => {
    const post = await makePost(clientId)
    await prisma.application.create({ data: { workerId, postId: post.id, status: 'Pending' } })

    const results = await findApplicationsByWorker(workerId)

    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('Pending')
  })

  it('excludes Rejected applications', async () => {
    const post = await makePost(clientId)
    await prisma.application.create({ data: { workerId, postId: post.id, status: 'Rejected' } })

    const results = await findApplicationsByWorker(workerId)

    expect(results).toHaveLength(0)
  })

  it('excludes Dismissed applications', async () => {
    const post = await makePost(clientId)
    await prisma.application.create({ data: { workerId, postId: post.id, status: 'Dismissed' } })

    const results = await findApplicationsByWorker(workerId)

    expect(results).toHaveLength(0)
  })

  it('returns only this worker\'s applications', async () => {
    const otherWorker = await createUser('other@test.com', 'Other', 'hashed')
    const post = await makePost(clientId)
    await prisma.application.create({ data: { workerId: otherWorker.id, postId: post.id, status: 'Pending' } })

    const results = await findApplicationsByWorker(workerId)

    expect(results).toHaveLength(0)
  })

  it('returns empty array when worker has no applications', async () => {
    const results = await findApplicationsByWorker(workerId)
    expect(results).toEqual([])
  })
})
