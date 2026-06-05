import { describe, it, expect, vi, beforeEach } from 'vitest'
import { findPostById } from '../../src/infrastructure/database/post.database.js'
import { findAcceptedApplication } from '../../src/infrastructure/database/application.database.js'
import { createReview as createReviewData } from '../../src/infrastructure/database/review.database.js'
import { createReview, validateReviewInput } from '../../src/domain/services/review.service.js'
import type { CreateReviewInput } from '../../src/domain/types/review.types.js'
import type { DomainWorkerReview } from '../../src/domain/types/worker.types.js'

vi.mock('../../src/infrastructure/database/post.database.js', () => ({
  findPostById: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/application.database.js', () => ({
  findAcceptedApplication: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/review.database.js', () => ({
  createReview: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())

const userId = 'user-uuid-1'
const postId = 'post-uuid-1'
const workerId = 'worker-uuid-1'

const validInput: CreateReviewInput = {
  postId,
  rating: 5,
  description: 'Great work!',
}

const mockPost = {
  id: postId,
  userId,
  title: 'Test Post',
  description: 'Test',
  address: 'Calle 123',
  startDate: new Date('2026-06-01'),
  endDate: new Date('2026-06-15'),
  status: 'Completed',
  createdAt: new Date(),
  images: [],
  latitude: null,
  longitude: null,
  categories: [],
  user: { id: userId, name: 'Test', surname: 'User' },
}

const mockAcceptedApp = {
  id: 'app-uuid-1',
  workerId,
  postId,
  status: 'Accepted',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockReview: DomainWorkerReview = {
  id: 'review-uuid-1',
  rating: 5,
  description: 'Great work!',
  mediaUrls: null,
  createdAt: new Date(),
  reviewer: { id: userId, name: 'Test User' },
  application: {
    postId,
    post: { id: postId, title: 'Test Post' },
  },
}

describe('validateReviewInput', () => {
  it('should throw 400 when rating is less than 1', () => {
    expect(() => validateReviewInput({ ...validInput, rating: 0 })).toThrow('Rating must be an integer between 1 and 5')
  })

  it('should throw 400 when rating is greater than 5', () => {
    expect(() => validateReviewInput({ ...validInput, rating: 6 })).toThrow('Rating must be an integer between 1 and 5')
  })

  it('should throw 400 when rating is not an integer', () => {
    expect(() => validateReviewInput({ ...validInput, rating: 3.5 })).toThrow('Rating must be an integer between 1 and 5')
  })

  it('should throw 400 when description exceeds 500 characters', () => {
    expect(() => validateReviewInput({ ...validInput, description: 'a'.repeat(501) })).toThrow('Description must not exceed 500 characters')
  })

  it('should not throw with valid input', () => {
    expect(() => validateReviewInput(validInput)).not.toThrow()
  })

  it('should not throw when description is omitted', () => {
    expect(() => validateReviewInput({ postId, rating: 5 })).not.toThrow()
  })
})

describe('createReview', () => {
  it('should create a review successfully', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)
    vi.mocked(findAcceptedApplication).mockResolvedValue(mockAcceptedApp)
    vi.mocked(createReviewData).mockResolvedValue(mockReview)

    const result = await createReview(postId, userId, validInput)

    expect(findPostById).toHaveBeenCalledWith(postId)
    expect(findAcceptedApplication).toHaveBeenCalledWith(postId)
    expect(createReviewData).toHaveBeenCalledWith({
      applicationId: mockAcceptedApp.id,
      reviewerId: userId,
      workerId,
      rating: 5,
      description: 'Great work!',
      mediaUrls: undefined,
    })
    expect(result).toEqual(mockReview)
  })

  it('should throw 404 when post is not found', async () => {
    vi.mocked(findPostById).mockResolvedValue(null)

    await expect(createReview(postId, userId, validInput)).rejects.toMatchObject({ status: 404 })
    expect(createReviewData).not.toHaveBeenCalled()
  })

  it('should throw 403 when user does not own the post', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)

    await expect(createReview(postId, 'other-user-id', validInput)).rejects.toMatchObject({ status: 403 })
    expect(createReviewData).not.toHaveBeenCalled()
  })

  it('should throw 400 when post is not completed', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...mockPost, status: 'Active' })

    await expect(createReview(postId, userId, validInput)).rejects.toMatchObject({ status: 400, message: 'Post must be completed before reviewing' })
    expect(createReviewData).not.toHaveBeenCalled()
  })

  it('should throw 400 when no accepted application exists', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)
    vi.mocked(findAcceptedApplication).mockResolvedValue(null)

    await expect(createReview(postId, userId, validInput)).rejects.toMatchObject({ status: 400, message: 'No accepted application found for this post' })
    expect(createReviewData).not.toHaveBeenCalled()
  })

  it('should create a review without optional description', async () => {
    const inputWithoutDesc: CreateReviewInput = { postId, rating: 4 }
    vi.mocked(findPostById).mockResolvedValue(mockPost)
    vi.mocked(findAcceptedApplication).mockResolvedValue(mockAcceptedApp)
    vi.mocked(createReviewData).mockResolvedValue({ ...mockReview, rating: 4, description: '' })

    const result = await createReview(postId, userId, inputWithoutDesc)

    expect(createReviewData).toHaveBeenCalledWith({
      applicationId: mockAcceptedApp.id,
      reviewerId: userId,
      workerId,
      rating: 4,
      description: undefined,
      mediaUrls: undefined,
    })
    expect(result.rating).toBe(4)
  })
})
