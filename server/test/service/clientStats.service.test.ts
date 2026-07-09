import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/infrastructure/database/clientStats.database.js', () => ({
  countClientPosts: vi.fn(),
  findCompletedPostsWithApps: vi.fn(),
}))

vi.mock('../../src/domain/services/user.service.js', () => ({
  getClientRating: vi.fn(),
}))

import * as clientStatsData from '../../src/infrastructure/database/clientStats.database.js'
import * as userService from '../../src/domain/services/user.service.js'
import { getClientStats } from '../../src/domain/services/clientStats.service.js'

beforeEach(() => vi.clearAllMocks())

describe('getClientStats', () => {
  it('returns stats with all values computed correctly', async () => {
    vi.mocked(clientStatsData.countClientPosts).mockResolvedValue(5)
    vi.mocked(clientStatsData.findCompletedPostsWithApps).mockResolvedValue([])
    vi.mocked(userService.getClientRating).mockResolvedValue({ averageRating: 4.2, reviewCount: 3 })

    const result = await getClientStats('user-1')

    expect(result.completedPosts).toBe(5)
    expect(result.cancelledPosts).toBe(5)
    expect(result.unreviewedJobs).toBe(0)
    expect(result.clientRating).toEqual({ averageRating: 4.2, reviewCount: 3 })
  })

  it('calls correct database functions with userId', async () => {
    vi.mocked(clientStatsData.countClientPosts).mockResolvedValue(0)
    vi.mocked(clientStatsData.findCompletedPostsWithApps).mockResolvedValue([])
    vi.mocked(userService.getClientRating).mockResolvedValue({ averageRating: 0, reviewCount: 0 })

    await getClientStats('user-1')

    expect(clientStatsData.countClientPosts).toHaveBeenCalledWith('user-1', 'Completed')
    expect(clientStatsData.countClientPosts).toHaveBeenCalledWith('user-1', 'Cancelled')
    expect(clientStatsData.findCompletedPostsWithApps).toHaveBeenCalledWith('user-1')
    expect(userService.getClientRating).toHaveBeenCalledWith('user-1')
  })

  it('calculates unreviewedJobs from posts without reviews', async () => {
    const withReview = { id: 'p1', applications: [{ review: { id: 'r1' } }] }
    const withoutReview = { id: 'p2', applications: [{ review: null }] }
    vi.mocked(clientStatsData.countClientPosts).mockResolvedValue(2)
    vi.mocked(clientStatsData.findCompletedPostsWithApps).mockResolvedValue([withReview, withoutReview] as never[])
    vi.mocked(userService.getClientRating).mockResolvedValue({ averageRating: 0, reviewCount: 0 })

    const result = await getClientStats('user-1')

    expect(result.unreviewedJobs).toBe(1)
  })

  it('returns zeros when there is no data', async () => {
    vi.mocked(clientStatsData.countClientPosts).mockResolvedValue(0)
    vi.mocked(clientStatsData.findCompletedPostsWithApps).mockResolvedValue([])
    vi.mocked(userService.getClientRating).mockResolvedValue({ averageRating: 0, reviewCount: 0 })

    const result = await getClientStats('user-1')

    expect(result).toEqual({
      completedPosts: 0,
      cancelledPosts: 0,
      unreviewedJobs: 0,
      clientRating: { averageRating: 0, reviewCount: 0 },
    })
  })
})
