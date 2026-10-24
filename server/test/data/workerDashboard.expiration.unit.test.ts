import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PostType } from '../../src/domain/types/postType.js'

const db = vi.hoisted(() => ({
  post: { count: vi.fn() },
}))

vi.mock('../../src/lib/prisma.js', () => ({ default: db }))

import { countNewJobsForWorker } from '../../src/infrastructure/database/workerDashboard.database.js'

describe('countNewJobsForWorker availability rule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    db.post.count.mockResolvedValue(0)
  })

  it('uses the same availability filter as the public post listings', async () => {
    await countNewJobsForWorker(['category-1'])

    expect(db.post.count).toHaveBeenCalledWith({
      where: {
        status: 'Active',
        type: { in: [PostType.Post, PostType.Emergency] },
        OR: [
          { type: PostType.Post, isEmergency: false },
          { emergencyExpiresAt: { gt: expect.any(Date) } },
        ],
        categories: {
          some: { categoryId: { in: ['category-1'] } },
        },
      },
    })
  })

  it('returns 0 without querying when the worker has no categories', async () => {
    await expect(countNewJobsForWorker([])).resolves.toBe(0)
    expect(db.post.count).not.toHaveBeenCalled()
  })
})
