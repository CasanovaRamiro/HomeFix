import { describe, it, expect, vi, beforeEach } from 'vitest'
import { findApplicationById } from '../../src/infrastructure/database/application.database.js'
import { createClientReview as createClientReviewData } from '../../src/infrastructure/database/clientReview.database.js'
import { findClientReviewByApplicationId } from '../../src/infrastructure/database/clientReview.database.js'
import { createClientReview, validateClientReviewInput } from '../../src/domain/services/clientReview.service.js'
import type { DomainClientReview } from '../../src/domain/types/clientReview.types.js'

vi.mock('../../src/infrastructure/database/application.database.js', () => ({
  findApplicationById: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/clientReview.database.js', () => ({
  createClientReview: vi.fn(),
  findClientReviewByApplicationId: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())

const workerId = 'worker-uuid-1'
const clientId = 'client-uuid-1'
const applicationId = 'app-uuid-1'
const postId = 'post-uuid-1'

const mockApplication = {
  id: applicationId,
  workerId,
  postId,
  status: 'Accepted',
  createdAt: new Date(),
  updatedAt: new Date(),
  post: {
    userId: clientId,
    status: 'Completed',
  },
}

const mockReview: DomainClientReview = {
  id: 'review-uuid-1',
  rating: 4,
  description: 'Great client',
  createdAt: new Date(),
  reviewer: { id: workerId, name: 'Worker Test' },
  client: { id: clientId, name: 'Client Test' },
}

describe('validateClientReviewInput', () => {
  it('should throw 400 when rating is less than 1', () => {
    expect(() => validateClientReviewInput({ applicationId, rating: 0 })).toThrow(
      'Rating must be an integer between 1 and 5',
    )
  })

  it('should throw 400 when rating is greater than 5', () => {
    expect(() => validateClientReviewInput({ applicationId, rating: 6 })).toThrow(
      'Rating must be an integer between 1 and 5',
    )
  })

  it('should throw 400 when rating is not an integer', () => {
    expect(() => validateClientReviewInput({ applicationId, rating: 3.5 })).toThrow(
      'Rating must be an integer between 1 and 5',
    )
  })

  it('should throw 400 when description exceeds 500 characters', () => {
    expect(() =>
      validateClientReviewInput({ applicationId, rating: 5, description: 'a'.repeat(501) }),
    ).toThrow('Description must not exceed 500 characters')
  })

  it('should not throw with valid input', () => {
    expect(() =>
      validateClientReviewInput({ applicationId, rating: 4, description: 'Great client' }),
    ).not.toThrow()
  })

  it('should not throw when description is omitted', () => {
    expect(() => validateClientReviewInput({ applicationId, rating: 5 })).not.toThrow()
  })
})

describe('createClientReview (service)', () => {
  it('should create a client review successfully', async () => {
    vi.mocked(findApplicationById).mockResolvedValue(mockApplication as any)
    vi.mocked(findClientReviewByApplicationId).mockResolvedValue(null)
    vi.mocked(createClientReviewData).mockResolvedValue(mockReview)

    const result = await createClientReview(applicationId, workerId, {
      applicationId,
      rating: 4,
      description: 'Great client',
    })

    expect(findApplicationById).toHaveBeenCalledWith(applicationId)
    expect(createClientReviewData).toHaveBeenCalledWith({
      applicationId,
      reviewerId: workerId,
      clientId,
      rating: 4,
      description: 'Great client',
    })
    expect(result).toEqual(mockReview)
  })

  it('should throw 404 when application is not found', async () => {
    vi.mocked(findApplicationById).mockResolvedValue(null)

    await expect(
      createClientReview(applicationId, workerId, { applicationId, rating: 5 }),
    ).rejects.toMatchObject({ status: 404, message: 'Application not found' })
    expect(createClientReviewData).not.toHaveBeenCalled()
  })

  it('should throw 403 when user is not the application worker', async () => {
    vi.mocked(findApplicationById).mockResolvedValue(mockApplication as any)

    await expect(
      createClientReview(applicationId, 'other-worker-id', { applicationId, rating: 5 }),
    ).rejects.toMatchObject({ status: 403, message: 'Forbidden' })
    expect(createClientReviewData).not.toHaveBeenCalled()
  })

  it('should throw 400 when post is not completed', async () => {
    vi.mocked(findApplicationById).mockResolvedValue({
      ...mockApplication,
      post: { userId: clientId, status: 'Active' },
    } as any)

    await expect(
      createClientReview(applicationId, workerId, { applicationId, rating: 5 }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'Post must be completed before reviewing',
    })
    expect(createClientReviewData).not.toHaveBeenCalled()
  })

  it('should throw 400 when a client review already exists', async () => {
    vi.mocked(findApplicationById).mockResolvedValue(mockApplication as any)
    vi.mocked(findClientReviewByApplicationId).mockResolvedValue(mockReview)

    await expect(
      createClientReview(applicationId, workerId, { applicationId, rating: 5 }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'A review already exists for this application',
    })
    expect(createClientReviewData).not.toHaveBeenCalled()
  })

  it('should create a review without description', async () => {
    vi.mocked(findApplicationById).mockResolvedValue(mockApplication as any)
    vi.mocked(findClientReviewByApplicationId).mockResolvedValue(null)
    vi.mocked(createClientReviewData).mockResolvedValue({ ...mockReview, rating: 5, description: '' })

    const result = await createClientReview(applicationId, workerId, {
      applicationId,
      rating: 5,
    })

    expect(createClientReviewData).toHaveBeenCalledWith({
      applicationId,
      reviewerId: workerId,
      clientId,
      rating: 5,
      description: undefined,
    })
    expect(result.rating).toBe(5)
  })
})
