import { describe, it, expect, beforeEach } from 'vitest'
import { cleanDb, createUser, prisma } from '../helpers/db.js'
import {
  findApplicationsByWorker,
  deleteApplication,
  findApplicationsByPost,
} from '../../src/infrastructure/database/application.database.js'

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

  it('returns application with clientReview populated when a client review exists', async () => {
    const post = await makePost(clientId)
    const application = await prisma.application.create({ data: { workerId, postId: post.id, status: 'Accepted' } })
    await prisma.clientReview.create({
      data: {
        applicationId: application.id,
        reviewerId: workerId,
        clientId,
        rating: 4,
        description: 'Great client',
      },
    })

    const results = await findApplicationsByWorker(workerId)

    expect(results).toHaveLength(1)
    expect(results[0].clientReview).not.toBeNull()
    expect(results[0].clientReview!.rating).toBe(4)
    expect(results[0].clientReview!.description).toBe('Great client')
    expect(results[0].clientReview!.createdAt).toBeInstanceOf(Date)
  })
})

describe('deleteApplication', () => {
  it('deletes a Pending application belonging to the worker', async () => {
    const post = await makePost(clientId)
    await prisma.application.create({ data: { workerId, postId: post.id, status: 'Pending' } })

    const app = await prisma.application.findFirst({ where: { workerId, postId: post.id } })
    const result = await deleteApplication(workerId, app!.id)

    expect(result.count).toBe(1)
  })

  it('does not delete an Accepted application', async () => {
    const post = await makePost(clientId)
    await prisma.application.create({ data: { workerId, postId: post.id, status: 'Accepted' } })

    const app = await prisma.application.findFirst({ where: { workerId, postId: post.id } })
    const result = await deleteApplication(workerId, app!.id)

    expect(result.count).toBe(0)
  })

  it('does not delete an application belonging to another worker', async () => {
    const otherWorker = await createUser('other@test.com', 'Other', 'hashed')
    const post = await makePost(clientId)
    await prisma.application.create({ data: { workerId: otherWorker.id, postId: post.id, status: 'Pending' } })

    const app = await prisma.application.findFirst({ where: { workerId: otherWorker.id, postId: post.id } })
    const result = await deleteApplication(workerId, app!.id)

    expect(result.count).toBe(0)
  })
})

describe('findApplicationsByPost', () => {
  it('returns empty array when no applications exist for the post', async () => {
    const post = await makePost(clientId)
    const result = await findApplicationsByPost(post.id)
    expect(result).toEqual([])
  })

  it('returns applications for the given post', async () => {
    const post = await makePost(clientId)
    await prisma.application.create({ data: { workerId, postId: post.id, status: 'Pending' } })

    const result = await findApplicationsByPost(post.id)

    expect(result).toHaveLength(1)
    expect(result[0].workerId).toBe(workerId)
  })

  it('does not return applications from other posts', async () => {
    const post1 = await makePost(clientId)
    const post2 = await makePost(clientId)
    const otherWorker = await createUser('other@test.com', 'Other', 'hashed')
    await prisma.application.create({ data: { workerId, postId: post1.id, status: 'Pending' } })
    await prisma.application.create({ data: { workerId: otherWorker.id, postId: post2.id, status: 'Pending' } })

    const result = await findApplicationsByPost(post1.id)

    expect(result).toHaveLength(1)
  })

  it('returns applications ordered by createdAt descending', async () => {
    const post = await makePost(clientId)
    const worker2 = await createUser('w2@test.com', 'W2', 'hashed')
    await prisma.application.create({ data: { workerId, postId: post.id, status: 'Pending' } })
    await new Promise((r) => setTimeout(r, 10))
    await prisma.application.create({ data: { workerId: worker2.id, postId: post.id, status: 'Pending' } })

    const result = await findApplicationsByPost(post.id)

    expect(result[0].workerId).toBe(worker2.id)
    expect(result[1].workerId).toBe(workerId)
  })
})
