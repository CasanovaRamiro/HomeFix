import { describe, it, expect, vi, beforeEach } from 'vitest'
import { findPostById } from '../../src/infrastructure/database/post.database.js'
import { findAcceptedApplication, findApplicationById } from '../../src/infrastructure/database/application.database.js'
import { createReview as createReviewData, createClientReview as createClientReviewData, findClientReviewByApplicationId } from '../../src/infrastructure/database/review.database.js'
import { createWorkerReview, createClientReview } from '../../src/domain/services/review.service.js'
import type { CreateReviewInput, DomainClientReview } from '../../src/domain/types/review.types.js'
import type { DomainWorkerReview } from '../../src/domain/types/worker.types.js'

vi.mock('../../src/infrastructure/database/post.database.js', () => ({
  findPostById: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/application.database.js', () => ({
  findAcceptedApplication: vi.fn(),
  findApplicationById: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/review.database.js', () => ({
  createReview: vi.fn(),
  createClientReview: vi.fn(),
  findClientReviewByApplicationId: vi.fn(),
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
  message: null,
  availableDays: null,
  availableTimeFrom: null,
  availableTimeTo: null,
  chargesVisit: false,
  visitCost: null,
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

describe('createWorkerReview (validation)', () => {
  it('should throw 400 when rating is less than 1', async () => {
    await expect(createWorkerReview(postId, userId, { ...validInput, rating: 0 })).rejects.toMatchObject({ status: 400, message: 'Rating must be an integer between 1 and 5' })
  })

  it('should throw 400 when rating is greater than 5', async () => {
    await expect(createWorkerReview(postId, userId, { ...validInput, rating: 6 })).rejects.toMatchObject({ status: 400, message: 'Rating must be an integer between 1 and 5' })
  })

  it('should throw 400 when rating is not an integer', async () => {
    await expect(createWorkerReview(postId, userId, { ...validInput, rating: 3.5 })).rejects.toMatchObject({ status: 400, message: 'Rating must be an integer between 1 and 5' })
  })

  it('should throw 400 when description exceeds 500 characters', async () => {
    await expect(createWorkerReview(postId, userId, { ...validInput, description: 'a'.repeat(501) })).rejects.toMatchObject({ status: 400, message: 'Description must not exceed 500 characters' })
  })

  it('should not throw with valid input', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)
    vi.mocked(findAcceptedApplication).mockResolvedValue(mockAcceptedApp)
    vi.mocked(createReviewData).mockResolvedValue(mockReview)
    await expect(createWorkerReview(postId, userId, validInput)).resolves.toBeDefined()
  })

  it('should not throw when description is omitted', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)
    vi.mocked(findAcceptedApplication).mockResolvedValue(mockAcceptedApp)
    vi.mocked(createReviewData).mockResolvedValue(mockReview)
    await expect(createWorkerReview(postId, userId, { postId, rating: 5 })).resolves.toBeDefined()
  })
})

describe('createWorkerReview', () => {
  it('should create a review successfully', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)
    vi.mocked(findAcceptedApplication).mockResolvedValue(mockAcceptedApp)
    vi.mocked(createReviewData).mockResolvedValue(mockReview)

    const result = await createWorkerReview(postId, userId, validInput)

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

    await expect(createWorkerReview(postId, userId, validInput)).rejects.toMatchObject({ status: 404 })
    expect(createReviewData).not.toHaveBeenCalled()
  })

  it('should throw 403 when user does not own the post', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)

    await expect(createWorkerReview(postId, 'other-user-id', validInput)).rejects.toMatchObject({ status: 403 })
    expect(createReviewData).not.toHaveBeenCalled()
  })

  it('should throw 400 when post is neither completed nor cancelled', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...mockPost, status: 'Active' })

    await expect(createWorkerReview(postId, userId, validInput)).rejects.toMatchObject({ status: 400, message: 'Post must be completed or cancelled before reviewing' })
    expect(createReviewData).not.toHaveBeenCalled()
  })

  it('should create a review on a cancelled post that had a hired worker', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...mockPost, status: 'Cancelled' })
    vi.mocked(findAcceptedApplication).mockResolvedValue(mockAcceptedApp)
    vi.mocked(createReviewData).mockResolvedValue(mockReview)

    const result = await createWorkerReview(postId, userId, validInput)

    expect(findAcceptedApplication).toHaveBeenCalledWith(postId)
    expect(createReviewData).toHaveBeenCalled()
    expect(result).toEqual(mockReview)
  })

  it('should throw 400 when no accepted application exists (e.g. cancelled while Active)', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...mockPost, status: 'Cancelled' })
    vi.mocked(findAcceptedApplication).mockResolvedValue(null)

    await expect(createWorkerReview(postId, userId, validInput)).rejects.toMatchObject({ status: 400, message: 'No accepted application found for this post' })
    expect(createReviewData).not.toHaveBeenCalled()
  })

  it('should create a review without optional description', async () => {
    const inputWithoutDesc: CreateReviewInput = { postId, rating: 4 }
    vi.mocked(findPostById).mockResolvedValue(mockPost)
    vi.mocked(findAcceptedApplication).mockResolvedValue(mockAcceptedApp)
    vi.mocked(createReviewData).mockResolvedValue({ ...mockReview, rating: 4, description: '' })

    const result = await createWorkerReview(postId, userId, inputWithoutDesc)

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

const workerId2 = 'worker-uuid-1'
const clientId2 = 'client-uuid-1'
const applicationId2 = 'app-uuid-1'
const postId2 = 'post-uuid-1'

const mockApplication = {
  id: applicationId2,
  workerId: workerId2,
  postId: postId2,
  status: 'Accepted',
  createdAt: new Date(),
  updatedAt: new Date(),
  post: {
    userId: clientId2,
    status: 'Completed',
  },
}

const mockClientReview: DomainClientReview = {
  id: 'review-uuid-1',
  rating: 4,
  description: 'Great client',
  createdAt: new Date(),
  reviewer: { id: workerId2, name: 'Worker Test' },
  client: { id: clientId2, name: 'Client Test' },
}

describe('createClientReview', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should create a client review successfully', async () => {
    vi.mocked(findApplicationById).mockResolvedValue(mockApplication as never)
    vi.mocked(findClientReviewByApplicationId).mockResolvedValue(null)
    vi.mocked(createClientReviewData).mockResolvedValue(mockClientReview)

    const result = await createClientReview(applicationId2, workerId2, {
      applicationId: applicationId2,
      rating: 4,
      description: 'Great client',
    })

    expect(findApplicationById).toHaveBeenCalledWith(applicationId2)
    expect(createClientReviewData).toHaveBeenCalledWith({
      applicationId: applicationId2,
      reviewerId: workerId2,
      clientId: clientId2,
      rating: 4,
      description: 'Great client',
    })
    expect(result).toEqual(mockClientReview)
  })

  it('should throw 404 when application is not found', async () => {
    vi.mocked(findApplicationById).mockResolvedValue(null)

    await expect(
      createClientReview(applicationId2, workerId2, { applicationId: applicationId2, rating: 5 }),
    ).rejects.toMatchObject({ status: 404, message: 'Application not found' })
    expect(createClientReviewData).not.toHaveBeenCalled()
  })

  it('should throw 403 when user is not the application worker', async () => {
    vi.mocked(findApplicationById).mockResolvedValue(mockApplication as never)

    await expect(
      createClientReview(applicationId2, 'other-worker-id', { applicationId: applicationId2, rating: 5 }),
    ).rejects.toMatchObject({ status: 403, message: 'Forbidden' })
    expect(createClientReviewData).not.toHaveBeenCalled()
  })

  it('should throw 400 when post is not completed', async () => {
    vi.mocked(findApplicationById).mockResolvedValue({
      ...mockApplication,
      post: { userId: clientId2, status: 'Active' },
    } as never)

    await expect(
      createClientReview(applicationId2, workerId2, { applicationId: applicationId2, rating: 5 }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'Post must be completed before reviewing',
    })
    expect(createClientReviewData).not.toHaveBeenCalled()
  })

  it('should throw 400 when a client review already exists', async () => {
    vi.mocked(findApplicationById).mockResolvedValue(mockApplication as never)
    vi.mocked(findClientReviewByApplicationId).mockResolvedValue(mockClientReview)

    await expect(
      createClientReview(applicationId2, workerId2, { applicationId: applicationId2, rating: 5 }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'A review already exists for this application',
    })
    expect(createClientReviewData).not.toHaveBeenCalled()
  })

  it('should create a review without description', async () => {
    vi.mocked(findApplicationById).mockResolvedValue(mockApplication as never)
    vi.mocked(findClientReviewByApplicationId).mockResolvedValue(null)
    vi.mocked(createClientReviewData).mockResolvedValue({ ...mockClientReview, rating: 5, description: '' })

    const result = await createClientReview(applicationId2, workerId2, {
      applicationId: applicationId2,
      rating: 5,
    })

    expect(createClientReviewData).toHaveBeenCalledWith({
      applicationId: applicationId2,
      reviewerId: workerId2,
      clientId: clientId2,
      rating: 5,
      description: undefined,
    })
    expect(result.rating).toBe(5)
  })
})
