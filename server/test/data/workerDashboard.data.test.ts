import { describe, it, expect, beforeEach } from 'vitest'
import { cleanDb, createUser, createCategory, prisma } from '../helpers/db.js'
import { UserRole } from '../../src/domain/types/userRole.js'
import {
  findWorkerProfile,
  countWorkerReviews,
  countWorkerApplications,
  countNewJobsForWorker,
  countCompletedJobs,
  countDismissedJobs,
} from '../../src/infrastructure/database/workerDashboard.database.js'

let workerId: string
let clientId: string

beforeEach(async () => {
  await cleanDb()
  const worker = await createUser('worker@test.com', 'Ana', 'hashed', { role: UserRole.Worker })
  const client = await createUser('client@test.com', 'Client', 'hashed')
  workerId = worker.id
  clientId = client.id
})

const makePost = () =>
  prisma.post.create({
    data: {
      userId: clientId,
      title: 'Test Post',
      description: 'Description',
      address: 'Calle 123',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-15'),
    },
  })

describe('findWorkerProfile', () => {
  it('returns null when worker does not exist', async () => {
    const result = await findWorkerProfile('non-existent-id')
    expect(result).toBeNull()
  })

  it('returns null for a non-worker user', async () => {
    const result = await findWorkerProfile(clientId)
    expect(result).toBeNull()
  })

  it('returns the worker profile', async () => {
    const result = await findWorkerProfile(workerId)
    expect(result).not.toBeNull()
    expect(result!.email).toBe('worker@test.com')
    expect(result!.name).toBe('Ana')
  })

  it('returns empty categories when worker has none', async () => {
    const result = await findWorkerProfile(workerId)
    expect(result!.categories).toEqual([])
  })

  it('returns categories when worker has some assigned', async () => {
    const category = await createCategory('Plumbing')
    await prisma.userCategory.create({ data: { userId: workerId, categoryId: category.id } })

    const result = await findWorkerProfile(workerId)
    expect(result!.categories).toHaveLength(1)
    expect(result!.categories[0].name).toBe('Plumbing')
  })

  it('returns location derived from address', async () => {
    const result = await findWorkerProfile(workerId)
    expect(result!.location).toBe('Test city, Test state')
  })

  it('returns createdAt as a Date', async () => {
    const result = await findWorkerProfile(workerId)
    expect(result!.createdAt).toBeInstanceOf(Date)
  })
})

describe('countWorkerReviews', () => {
  it('returns count 0 and avgRating 0 when no reviews exist', async () => {
    const result = await countWorkerReviews(workerId)
    expect(result.count).toBe(0)
    expect(result.avgRating).toBe(0)
  })

  it('returns correct count and avgRating when reviews exist', async () => {
    const post = await makePost()
    const app = await prisma.application.create({
      data: { workerId, postId: post.id, status: 'Completed' },
    })
    await prisma.workerReview.create({
      data: { applicationId: app.id, reviewerId: clientId, workerId, rating: 4, description: 'Good' },
    })

    const result = await countWorkerReviews(workerId)
    expect(result.count).toBe(1)
    expect(result.avgRating).toBe(4)
  })

  it('does not count reviews for other workers', async () => {
    const other = await createUser('other@test.com', 'Other', 'hashed', { role: UserRole.Worker })
    const post = await makePost()
    const app = await prisma.application.create({
      data: { workerId: other.id, postId: post.id, status: 'Completed' },
    })
    await prisma.workerReview.create({
      data: { applicationId: app.id, reviewerId: clientId, workerId: other.id, rating: 5, description: '' },
    })

    const result = await countWorkerReviews(workerId)
    expect(result.count).toBe(0)
    expect(result.avgRating).toBe(0)
  })
})

describe('countWorkerApplications', () => {
  it('returns empty array when worker has no applications', async () => {
    const result = await countWorkerApplications(workerId)
    expect(result).toEqual([])
  })

  it('returns applications grouped by status', async () => {
    const post1 = await makePost()
    const post2 = await prisma.post.create({
      data: {
        userId: clientId,
        title: 'Post 2',
        description: 'Desc',
        address: 'Calle 456',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
      },
    })
    await prisma.application.create({ data: { workerId, postId: post1.id, status: 'Pending' } })
    await prisma.application.create({ data: { workerId, postId: post2.id, status: 'Completed' } })

    const result = await countWorkerApplications(workerId)
    expect(result.length).toBeGreaterThanOrEqual(2)
    const byStatus = Object.fromEntries(result.map((r) => [r.status, r._count]))
    expect(byStatus['Pending']).toBe(1)
    expect(byStatus['Completed']).toBe(1)
  })

  it('does not count applications from other workers', async () => {
    const other = await createUser('other@test.com', 'Other', 'hashed', { role: UserRole.Worker })
    const post = await makePost()
    await prisma.application.create({ data: { workerId: other.id, postId: post.id, status: 'Pending' } })

    const result = await countWorkerApplications(workerId)
    expect(result).toEqual([])
  })
})

describe('countNewJobsForWorker', () => {
  it('returns 0 when categoryIds array is empty', async () => {
    const result = await countNewJobsForWorker([])
    expect(result).toBe(0)
  })

  it('returns count of active posts matching worker categories', async () => {
    const category = await createCategory('Plumbing')
    await prisma.post.create({
      data: {
        userId: clientId,
        title: 'Active Post',
        description: 'Desc',
        address: 'Calle 123',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'Active',
        categories: { create: { categoryId: category.id } },
      },
    })

    const result = await countNewJobsForWorker([category.id])
    expect(result).toBe(1)
  })

  it('returns 0 when no active posts match given categories', async () => {
    const category = await createCategory('Electrical')
    const result = await countNewJobsForWorker([category.id])
    expect(result).toBe(0)
  })

  it('does not count non-active posts', async () => {
    const category = await createCategory('Carpentry')
    await prisma.post.create({
      data: {
        userId: clientId,
        title: 'Inactive Post',
        description: 'Desc',
        address: 'Calle 123',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-15'),
        status: 'Cancelled',
        categories: { create: { categoryId: category.id } },
      },
    })

    const result = await countNewJobsForWorker([category.id])
    expect(result).toBe(0)
  })
})

describe('countCompletedJobs', () => {
  it('returns 0 when worker has no applications', async () => {
    const result = await countCompletedJobs(workerId)
    expect(result).toBe(0)
  })

  it('returns the number of completed applications', async () => {
    const post = await makePost()
    await prisma.application.create({ data: { workerId, postId: post.id, status: 'Completed' } })

    const result = await countCompletedJobs(workerId)
    expect(result).toBe(1)
  })

  it('does not count non-completed applications', async () => {
    const post = await makePost()
    await prisma.application.create({ data: { workerId, postId: post.id, status: 'Pending' } })

    const result = await countCompletedJobs(workerId)
    expect(result).toBe(0)
  })

  it('does not count completed jobs from other workers', async () => {
    const other = await createUser('other@test.com', 'Other', 'hashed', { role: UserRole.Worker })
    const post = await makePost()
    await prisma.application.create({ data: { workerId: other.id, postId: post.id, status: 'Completed' } })

    const result = await countCompletedJobs(workerId)
    expect(result).toBe(0)
  })
})

describe('countDismissedJobs', () => {
  it('returns 0 when worker has no applications', async () => {
    const result = await countDismissedJobs(workerId)
    expect(result).toBe(0)
  })

  it('returns the number of dismissed applications', async () => {
    const post = await makePost()
    await prisma.application.create({ data: { workerId, postId: post.id, status: 'Dismissed' } })

    const result = await countDismissedJobs(workerId)
    expect(result).toBe(1)
  })

  it('does not count non-dismissed applications', async () => {
    const post = await makePost()
    await prisma.application.create({ data: { workerId, postId: post.id, status: 'Completed' } })

    const result = await countDismissedJobs(workerId)
    expect(result).toBe(0)
  })

  it('does not count dismissed jobs from other workers', async () => {
    const other = await createUser('other@test.com', 'Other', 'hashed', { role: UserRole.Worker })
    const post = await makePost()
    await prisma.application.create({ data: { workerId: other.id, postId: post.id, status: 'Dismissed' } })

    const result = await countDismissedJobs(workerId)
    expect(result).toBe(0)
  })
})
