import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/infrastructure/database/worker.database.js', () => ({
  findAllWorkers: vi.fn(),
  findWorkerById: vi.fn(),
  updateWorker: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/review.database.js', () => ({
  findReviewsByWorkerId: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/workerDashboard.database.js', () => ({
  countCompletedJobs: vi.fn(),
  countDismissedJobs: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/report.database.js', () => ({
  countReportsByWorker: vi.fn(),
}))

vi.mock('../../src/domain/services/user.service.js', () => ({
  getUserRating: vi.fn(),
}))

vi.mock('../../src/infrastructure/providers/cloudinary.provider.js', () => ({
  deleteImage: vi.fn(),
}))

import * as workerData from '../../src/infrastructure/database/worker.database.js'
import * as reviewData from '../../src/infrastructure/database/review.database.js'
import * as userService from '../../src/domain/services/user.service.js'
import * as workerDashboardData from '../../src/infrastructure/database/workerDashboard.database.js'
import * as reportData from '../../src/infrastructure/database/report.database.js'
import * as cloudinary from '../../src/infrastructure/providers/cloudinary.provider.js'
import { listWorkers, getWorker, getWorkerStats, updateWorkerProfile, getWorkerReviews } from '../../src/domain/services/worker.service.js'
import { UserRole } from '../../src/domain/types/userRole.js'

const mockWorker = {
  id: 'uuid-worker-1',
  name: 'Ana',
  email: 'ana@test.com',
  phone: null as string | null,
  bio: null as string | null,
  role: UserRole.Worker,
  photo: null as string | null,
  matriculaUrl: null as string | null,
  availability: [] as string[],
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  categories: [{ id: 'uuid-category-1', name: 'Plumbing' }],
   certificates: [],
   gallery: [],
   emergenciesEnabled: true,
   location: null as string | null,
   isVerified: false,
 }


beforeEach(() => vi.clearAllMocks())

describe('worker.service - listWorkers', () => {
  it('returns all workers from the data layer', async () => {
    vi.mocked(workerData.findAllWorkers).mockResolvedValue([mockWorker])

    const result = await listWorkers()

    expect(workerData.findAllWorkers).toHaveBeenCalledTimes(1)
    expect(result).toEqual([mockWorker])
  })

  it('returns an empty array when there are no workers', async () => {
    vi.mocked(workerData.findAllWorkers).mockResolvedValue([])

    const result = await listWorkers()

    expect(result).toEqual([])
  })

})

describe('worker.service - getWorker', () => {
  it('returns the worker when found', async () => {
    vi.mocked(workerData.findWorkerById).mockResolvedValue(mockWorker)

    const result = await getWorker('uuid-worker-1')

    expect(workerData.findWorkerById).toHaveBeenCalledWith('uuid-worker-1')
    expect(result).toEqual(mockWorker)
  })

  it('throws when the worker does not exist', async () => {
    vi.mocked(workerData.findWorkerById).mockResolvedValue(null)

    await expect(getWorker('non-existent-id')).rejects.toThrow('Worker not found')
  })
})

describe('worker.service - updateWorkerProfile', () => {
  it('updates worker without touching photo when photo is not in input', async () => {
    vi.mocked(workerData.updateWorker).mockResolvedValue({ ...mockWorker, bio: 'Updated bio' })

    const result = await updateWorkerProfile('uuid-worker-1', { bio: 'Updated bio' })

    expect(workerData.findWorkerById).not.toHaveBeenCalled()
    expect(cloudinary.deleteImage).not.toHaveBeenCalled()
    expect(workerData.updateWorker).toHaveBeenCalledWith('uuid-worker-1', { bio: 'Updated bio' })
    expect(result.bio).toBe('Updated bio')
  })

  it('deletes old Cloudinary image when photo is replaced with a new one', async () => {
    const oldPhoto = 'https://res.cloudinary.com/demo/image/upload/v123/samples/old.jpg'
    vi.mocked(workerData.findWorkerById).mockResolvedValue({ ...mockWorker, photo: oldPhoto })
    vi.mocked(workerData.updateWorker).mockResolvedValue({ ...mockWorker, photo: 'https://res.cloudinary.com/demo/image/upload/v123/samples/new.jpg' })
    vi.mocked(cloudinary.deleteImage).mockResolvedValue(undefined)

    await updateWorkerProfile('uuid-worker-1', { photo: 'https://res.cloudinary.com/demo/image/upload/v123/samples/new.jpg' })

    expect(cloudinary.deleteImage).toHaveBeenCalledWith(oldPhoto)
  })

  it('skips delete when old photo is not a Cloudinary URL', async () => {
    vi.mocked(workerData.findWorkerById).mockResolvedValue({ ...mockWorker, photo: 'https://example.com/photo.jpg' })
    vi.mocked(workerData.updateWorker).mockResolvedValue({ ...mockWorker, photo: 'https://res.cloudinary.com/demo/image/upload/v123/new.jpg' })

    await updateWorkerProfile('uuid-worker-1', { photo: 'https://res.cloudinary.com/demo/image/upload/v123/new.jpg' })

    expect(cloudinary.deleteImage).not.toHaveBeenCalled()
  })

  it('skips delete when worker has no current photo', async () => {
    vi.mocked(workerData.findWorkerById).mockResolvedValue({ ...mockWorker, photo: null })
    vi.mocked(workerData.updateWorker).mockResolvedValue({ ...mockWorker, photo: 'https://res.cloudinary.com/demo/image/upload/v123/new.jpg' })

    await updateWorkerProfile('uuid-worker-1', { photo: 'https://res.cloudinary.com/demo/image/upload/v123/new.jpg' })

    expect(cloudinary.deleteImage).not.toHaveBeenCalled()
  })

  it('updates matriculaUrl when provided', async () => {
    vi.mocked(workerData.updateWorker).mockResolvedValue({ ...mockWorker, matriculaUrl: 'https://res.cloudinary.com/demo/upload/matricula.pdf' })

    const result = await updateWorkerProfile('uuid-worker-1', { matriculaUrl: 'https://res.cloudinary.com/demo/upload/matricula.pdf' })

    expect(workerData.updateWorker).toHaveBeenCalledWith('uuid-worker-1', { matriculaUrl: 'https://res.cloudinary.com/demo/upload/matricula.pdf' })
    expect(result.matriculaUrl).toBe('https://res.cloudinary.com/demo/upload/matricula.pdf')
  })

  it('deletes old Cloudinary matricula when replaced with a new one', async () => {
    const oldMatricula = 'https://res.cloudinary.com/demo/image/upload/v123/old-matricula.pdf'
    vi.mocked(workerData.findWorkerById).mockResolvedValue({ ...mockWorker, matriculaUrl: oldMatricula })
    vi.mocked(workerData.updateWorker).mockResolvedValue({ ...mockWorker, matriculaUrl: 'https://res.cloudinary.com/demo/image/upload/v123/new-matricula.pdf' })
    vi.mocked(cloudinary.deleteImage).mockResolvedValue(undefined)

    await updateWorkerProfile('uuid-worker-1', { matriculaUrl: 'https://res.cloudinary.com/demo/image/upload/v123/new-matricula.pdf' })

    expect(cloudinary.deleteImage).toHaveBeenCalledWith(oldMatricula)
  })

  it('clears matriculaUrl when set to null', async () => {
    vi.mocked(workerData.findWorkerById).mockResolvedValue({ ...mockWorker, matriculaUrl: 'https://res.cloudinary.com/demo/upload/old.pdf' })
    vi.mocked(workerData.updateWorker).mockResolvedValue({ ...mockWorker, matriculaUrl: null })
    vi.mocked(cloudinary.deleteImage).mockResolvedValue(undefined)

    await updateWorkerProfile('uuid-worker-1', { matriculaUrl: null })

    expect(cloudinary.deleteImage).toHaveBeenCalledWith('https://res.cloudinary.com/demo/upload/old.pdf')
    expect(workerData.updateWorker).toHaveBeenCalledWith('uuid-worker-1', { matriculaUrl: null })
  })
})

describe('worker.service - getWorkerReviews', () => {
  const mockReviews = [
    {
      id: 'review-1',
      workerId: 'uuid-worker-1',
      rating: 5,
      description: 'Excellent',
      mediaUrls: null,
      createdAt: new Date('2024-01-01'),
      reviewer: { id: 'client-1', name: 'Client' },
      application: { postId: 'post-1', post: { id: 'post-1', title: 'Fix pipes' } },
    },
  ]

  it('returns reviews for an existing worker', async () => {
    vi.mocked(workerData.findWorkerById).mockResolvedValue(mockWorker)
    vi.mocked(reviewData.findReviewsByWorkerId).mockResolvedValue(mockReviews)

    const result = await getWorkerReviews('uuid-worker-1')

    expect(workerData.findWorkerById).toHaveBeenCalledWith('uuid-worker-1')
    expect(reviewData.findReviewsByWorkerId).toHaveBeenCalledWith('uuid-worker-1')
    expect(result).toEqual(mockReviews)
  })

  it('throws 404 when worker does not exist', async () => {
    vi.mocked(workerData.findWorkerById).mockResolvedValue(null)

    await expect(getWorkerReviews('non-existent-id')).rejects.toThrow('Worker not found')
    expect(reviewData.findReviewsByWorkerId).not.toHaveBeenCalled()
  })
})

describe('worker.service - getWorkerStats', () => {
  it('returns stats for an existing worker', async () => {
    vi.mocked(workerData.findWorkerById).mockResolvedValue(mockWorker)
    vi.mocked(userService.getUserRating).mockResolvedValue({ reviewCount: 10, averageRating: 4.5 })
    vi.mocked(workerDashboardData.countCompletedJobs).mockResolvedValue(5)
    vi.mocked(workerDashboardData.countDismissedJobs).mockResolvedValue(2)
    vi.mocked(reportData.countReportsByWorker).mockResolvedValue(3)

    const result = await getWorkerStats('uuid-worker-1')

    expect(result.totalJobs).toBe(5)
    expect(result.cancelledJobs).toBe(2)
    expect(result.reports).toBe(3)
    expect(result.avgRating).toBe(4.5)
    expect(result.reviewCount).toBe(10)
  })

  it('throws 404 when worker does not exist', async () => {
    vi.mocked(workerData.findWorkerById).mockResolvedValue(null)

    await expect(getWorkerStats('non-existent-id')).rejects.toThrow('Worker not found')
  })

  it('returns 0 for cancelledJobs when worker has no dismissed applications', async () => {
    vi.mocked(workerData.findWorkerById).mockResolvedValue(mockWorker)
    vi.mocked(userService.getUserRating).mockResolvedValue({ reviewCount: 0, averageRating: 0 })
    vi.mocked(workerDashboardData.countCompletedJobs).mockResolvedValue(0)
    vi.mocked(workerDashboardData.countDismissedJobs).mockResolvedValue(0)
    vi.mocked(reportData.countReportsByWorker).mockResolvedValue(0)

    const result = await getWorkerStats('uuid-worker-1')

    expect(result.cancelledJobs).toBe(0)
    expect(result.totalJobs).toBe(0)
    expect(result.reports).toBe(0)
  })

  it('passes worker id to countDismissedJobs', async () => {
    vi.mocked(workerData.findWorkerById).mockResolvedValue(mockWorker)
    vi.mocked(userService.getUserRating).mockResolvedValue({ reviewCount: 0, averageRating: 0 })
    vi.mocked(workerDashboardData.countCompletedJobs).mockResolvedValue(0)
    vi.mocked(workerDashboardData.countDismissedJobs).mockResolvedValue(0)
    vi.mocked(reportData.countReportsByWorker).mockResolvedValue(0)

    await getWorkerStats('uuid-worker-1')

    expect(workerDashboardData.countDismissedJobs).toHaveBeenCalledWith('uuid-worker-1')
  })
})
