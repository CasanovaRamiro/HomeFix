import { describe, it, expect, vi, beforeEach } from 'vitest'
import { findAll, findClientReviewsByUserId, findWorkerReviewsByUserId, getWorkerReviewAggregate, getClientReviewAggregate, updateEmergencyNotifications, updateRequiresStartToken } from '../../src/infrastructure/database/user.database.js'
import { listUsers, getUserReviews, getUserRating, getClientRating, getWorkerRating, setEmergencyNotifications, setRequiresStartToken } from '../../src/domain/services/user.service.js'
import type { DomainClientReview } from '../../src/domain/types/review.types.js'
import type { DomainWorkerReview } from '../../src/domain/types/worker.types.js'
import { UserRole } from '../../src/domain/types/userRole.js'

vi.mock('../../src/infrastructure/database/user.database.js', () => ({
  findAll: vi.fn(),
  findClientReviewsByUserId: vi.fn(),
  findWorkerReviewsByUserId: vi.fn(),
  getWorkerReviewAggregate: vi.fn(),
  getClientReviewAggregate: vi.fn(),
  updateEmergencyNotifications: vi.fn(),
  updateRequiresStartToken: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())

const userId = 'user-uuid-1'

const mockClientReview: DomainClientReview = {
  id: 'client-review-1',
  rating: 4,
  description: 'Great client',
  createdAt: new Date('2026-06-01'),
  reviewer: { id: 'worker-1', name: 'Worker' },
  client: { id: userId, name: 'Client' },
}

const mockWorkerReview: DomainWorkerReview = {
  id: 'worker-review-1',
  rating: 5,
  description: 'Excellent work',
  mediaUrls: null,
  createdAt: new Date('2026-06-01'),
  reviewer: { id: 'client-1', name: 'Client' },
  application: {
    postId: 'post-1',
    post: { id: 'post-1', title: 'Fix pipes' },
  },
}

describe('getUserReviews', () => {
  it('returns client reviews when as=client', async () => {
    vi.mocked(findClientReviewsByUserId).mockResolvedValue([mockClientReview])

    const reviews = await getUserReviews(userId, UserRole.Client)

    expect(findClientReviewsByUserId).toHaveBeenCalledWith(userId)
    expect(reviews).toHaveLength(1)
    expect(reviews[0].rating).toBe(4)
  })

  it('returns worker reviews when as=worker', async () => {
    vi.mocked(findWorkerReviewsByUserId).mockResolvedValue([mockWorkerReview])

    const reviews = await getUserReviews(userId, UserRole.Worker)

    expect(findWorkerReviewsByUserId).toHaveBeenCalledWith(userId)
    expect(reviews).toHaveLength(1)
    expect(reviews[0].rating).toBe(5)
  })

  it('returns an empty array when as is not specified', async () => {
    const reviews = await getUserReviews(userId)

    expect(reviews).toEqual([])
    expect(findClientReviewsByUserId).not.toHaveBeenCalled()
    expect(findWorkerReviewsByUserId).not.toHaveBeenCalled()
  })
})

describe('getUserRating', () => {
  it('calculates weighted average from worker and client aggregates', async () => {
    vi.mocked(getWorkerReviewAggregate).mockResolvedValue({ _avg: { rating: 4.5 }, _count: 2 })
    vi.mocked(getClientReviewAggregate).mockResolvedValue({ _avg: { rating: 3.5 }, _count: 1 })

    const rating = await getUserRating(userId)

    expect(getWorkerReviewAggregate).toHaveBeenCalledWith(userId)
    expect(getClientReviewAggregate).toHaveBeenCalledWith(userId)
    expect(rating.averageRating).toBeCloseTo(4.2, 1)
    expect(rating.reviewCount).toBe(3)
  })

  it('returns zeros when there are no reviews', async () => {
    vi.mocked(getWorkerReviewAggregate).mockResolvedValue({ _avg: { rating: null }, _count: 0 })
    vi.mocked(getClientReviewAggregate).mockResolvedValue({ _avg: { rating: null }, _count: 0 })

    const rating = await getUserRating(userId)

    expect(rating.averageRating).toBe(0)
    expect(rating.reviewCount).toBe(0)
  })

  it('uses only worker aggregates when no client reviews exist', async () => {
    vi.mocked(getWorkerReviewAggregate).mockResolvedValue({ _avg: { rating: 4 }, _count: 3 })
    vi.mocked(getClientReviewAggregate).mockResolvedValue({ _avg: { rating: null }, _count: 0 })

    const rating = await getUserRating(userId)

    expect(rating.averageRating).toBe(4)
    expect(rating.reviewCount).toBe(3)
  })

  it('uses only client aggregates when no worker reviews exist', async () => {
    vi.mocked(getWorkerReviewAggregate).mockResolvedValue({ _avg: { rating: null }, _count: 0 })
    vi.mocked(getClientReviewAggregate).mockResolvedValue({ _avg: { rating: 5 }, _count: 1 })

    const rating = await getUserRating(userId)

    expect(rating.averageRating).toBe(5)
    expect(rating.reviewCount).toBe(1)
  })
})

describe('listUsers', () => {
  it('delegates to findAll', async () => {
    const mockUsers = [{ id: 'user-1', name: 'Alice', email: 'alice@test.com' }]
    vi.mocked(findAll).mockResolvedValue(mockUsers as never)

    const result = await listUsers()

    expect(findAll).toHaveBeenCalledTimes(1)
    expect(result).toEqual(mockUsers)
  })
})

describe('getClientRating', () => {
  it('calculates average rating when reviews exist', async () => {
    vi.mocked(getClientReviewAggregate).mockResolvedValue({ _avg: { rating: 4.2 }, _count: 5 })

    const rating = await getClientRating(userId)

    expect(getClientReviewAggregate).toHaveBeenCalledWith(userId)
    expect(rating.averageRating).toBe(4.2)
    expect(rating.reviewCount).toBe(5)
  })

  it('returns zero rating when no reviews exist', async () => {
    vi.mocked(getClientReviewAggregate).mockResolvedValue({ _avg: { rating: null }, _count: 0 })

    const rating = await getClientRating(userId)

    expect(rating.averageRating).toBe(0)
    expect(rating.reviewCount).toBe(0)
  })
})

describe('getWorkerRating', () => {
  it('calculates average rating when reviews exist', async () => {
    vi.mocked(getWorkerReviewAggregate).mockResolvedValue({ _avg: { rating: 3.8 }, _count: 10 })

    const rating = await getWorkerRating(userId)

    expect(getWorkerReviewAggregate).toHaveBeenCalledWith(userId)
    expect(rating.averageRating).toBe(3.8)
    expect(rating.reviewCount).toBe(10)
  })

  it('returns zero rating when no reviews exist', async () => {
    vi.mocked(getWorkerReviewAggregate).mockResolvedValue({ _avg: { rating: null }, _count: 0 })

    const rating = await getWorkerRating(userId)

    expect(rating.averageRating).toBe(0)
    expect(rating.reviewCount).toBe(0)
  })
})

describe('setEmergencyNotifications', () => {
  it('delegates to updateEmergencyNotifications', async () => {
    vi.mocked(updateEmergencyNotifications).mockResolvedValue(undefined as never)

    await setEmergencyNotifications(userId, true)

    expect(updateEmergencyNotifications).toHaveBeenCalledWith(userId, true)
  })
})

describe('setRequiresStartToken', () => {
  it('delegates to updateRequiresStartToken', async () => {
    vi.mocked(updateRequiresStartToken).mockResolvedValue(undefined as never)

    await setRequiresStartToken(userId, true)

    expect(updateRequiresStartToken).toHaveBeenCalledWith(userId, true)
  })
})
