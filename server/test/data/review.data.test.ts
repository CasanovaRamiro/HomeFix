import { describe, it, expect, beforeEach } from 'vitest'
import { cleanDb, createUser, prisma } from '../helpers/db.js'
import { UserRole } from '../../src/domain/types/userRole.js'
import { createReview, createClientReview } from '../../src/infrastructure/database/review.database.js'

let clientId: string
let workerId: string
let postId: string
let applicationId: string

beforeEach(async () => {
  await cleanDb()
  const client = await createUser('client@test.com', 'Client', 'hashed', { role: UserRole.Client })
  const worker = await createUser('worker@test.com', 'Worker', 'hashed', { role: UserRole.Worker })
  clientId = client.id
  workerId = worker.id

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
    data: {
      workerId,
      postId,
      status: 'Accepted',
    },
  })
  applicationId = application.id
})

describe('createReview (data layer)', () => {
  it('should create a review with all fields', async () => {
    const review = await createReview({
      applicationId,
      reviewerId: clientId,
      workerId,
      rating: 5,
      description: 'Excellent work!',
      mediaUrls: 'https://example.com/photo1.jpg,https://example.com/photo2.jpg',
    })

    expect(review.id).toBeDefined()
    expect(review.rating).toBe(5)
    expect(review.description).toBe('Excellent work!')
    expect(review.mediaUrls).toBe('https://example.com/photo1.jpg,https://example.com/photo2.jpg')
    expect(review.reviewer.id).toBe(clientId)
    expect(review.reviewer.name).toBe('Client')
    expect(review.application.postId).toBe(postId)
    expect(review.application.post.title).toBe('Fix pipes')
    expect(review.createdAt).toBeInstanceOf(Date)
  })

  it('should create a review with minimum fields (no description, no media)', async () => {
    const review = await createReview({
      applicationId,
      reviewerId: clientId,
      workerId,
      rating: 3,
    })

    expect(review.rating).toBe(3)
    expect(review.description).toBe('')
    expect(review.mediaUrls).toBeNull()
  })

  it('should create a review with description but no media', async () => {
    const review = await createReview({
      applicationId,
      reviewerId: clientId,
      workerId,
      rating: 4,
      description: 'Good job',
    })

    expect(review.rating).toBe(4)
    expect(review.description).toBe('Good job')
    expect(review.mediaUrls).toBeNull()
  })

  it('should fail when applicationId does not exist', async () => {
    await expect(createReview({
      applicationId: 'non-existent-id',
      reviewerId: clientId,
      workerId,
      rating: 5,
    })).rejects.toThrow()
  })

  it('should fail when reviewerId does not exist', async () => {
    await expect(createReview({
      applicationId,
      reviewerId: 'non-existent-id',
      workerId,
      rating: 5,
    })).rejects.toThrow()
  })

  it('should fail when workerId does not exist', async () => {
    await expect(createReview({
      applicationId,
      reviewerId: clientId,
      workerId: 'non-existent-id',
      rating: 5,
    })).rejects.toThrow()
  })
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
