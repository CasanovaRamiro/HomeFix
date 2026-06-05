import { describe, it, expect, beforeEach } from 'vitest'
import { cleanDb, createUser, prisma } from '../helpers/db.js'
import { UserRole } from '../../src/domain/types/userRole.js'
import { createClientReview } from '../../src/infrastructure/database/clientReview.database.js'

let workerId: string
let clientId: string
let postId: string
let applicationId: string

beforeEach(async () => {
  await cleanDb()
  const worker = await createUser('worker@test.com', 'Worker', 'hashed', { role: UserRole.Worker })
  const client = await createUser('client@test.com', 'Client', 'hashed', { role: UserRole.Client })
  workerId = worker.id
  clientId = client.id

  const post = await prisma.post.create({
    data: {
      userId: clientId,
      title: 'Fix pipes',
      description: 'Need a plumber',
      address: '123 Main St',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-02'),
      status: 'Completed',
    },
  })
  postId = post.id

  const application = await prisma.application.create({
    data: { workerId, postId, status: 'Accepted' },
  })
  applicationId = application.id
})

describe('createClientReview (data layer)', () => {
  it('should create a client review with all fields', async () => {
    const review = await createClientReview({
      applicationId,
      reviewerId: workerId,
      clientId,
      rating: 4,
      description: 'Great client, paid on time!',
    })

    expect(review.id).toBeDefined()
    expect(review.rating).toBe(4)
    expect(review.description).toBe('Great client, paid on time!')
    expect(review.reviewer.id).toBe(workerId)
    expect(review.reviewer.name).toBe('Worker')
    expect(review.client.id).toBe(clientId)
    expect(review.client.name).toBe('Client')
    expect(review.createdAt).toBeInstanceOf(Date)
  })

  it('should create a client review without description', async () => {
    const review = await createClientReview({
      applicationId,
      reviewerId: workerId,
      clientId,
      rating: 5,
    })

    expect(review.rating).toBe(5)
    expect(review.description).toBe('')
  })

  it('should create a client review with description only', async () => {
    const review = await createClientReview({
      applicationId,
      reviewerId: workerId,
      clientId,
      rating: 3,
      description: 'Average experience',
    })

    expect(review.rating).toBe(3)
    expect(review.description).toBe('Average experience')
  })

  it('should fail when applicationId does not exist', async () => {
    await expect(createClientReview({
      applicationId: 'non-existent-id',
      reviewerId: workerId,
      clientId,
      rating: 5,
    })).rejects.toThrow()
  })

  it('should fail when reviewerId does not exist', async () => {
    await expect(createClientReview({
      applicationId,
      reviewerId: 'non-existent-id',
      clientId,
      rating: 5,
    })).rejects.toThrow()
  })

  it('should fail when clientId does not exist', async () => {
    await expect(createClientReview({
      applicationId,
      reviewerId: workerId,
      clientId: 'non-existent-id',
      rating: 5,
    })).rejects.toThrow()
  })
})
