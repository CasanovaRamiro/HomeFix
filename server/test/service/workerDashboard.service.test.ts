import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/infrastructure/database/workerDashboard.database.js', () => ({
  findWorkerProfile: vi.fn(),
  countWorkerApplications: vi.fn(),
  countNewJobsForWorker: vi.fn(),
  countCompletedJobs: vi.fn(),
}))

vi.mock('../../src/domain/services/user.service.js', () => ({
  getUserRating: vi.fn(),
}))

import * as workerDashboardData from '../../src/infrastructure/database/workerDashboard.database.js'
import * as userService from '../../src/domain/services/user.service.js'
import { getWorkerDashboard } from '../../src/domain/services/workerDashboard.service.js'

const mockProfile = {
  id: 'worker-1',
  name: 'Ana',
  surname: 'García',
  email: 'ana@test.com',
  phone: '123456789',
  bio: 'Experienced plumber',
  photo: null,
  createdAt: new Date('2024-01-01'),
  location: 'Buenos Aires',
  categories: [{ id: 'cat-1', name: 'Plumbing' }],
  emergenciesEnabled: true,
}

beforeEach(() => vi.clearAllMocks())

describe('getWorkerDashboard', () => {
  it('returns dashboard data for an existing worker', async () => {
    vi.mocked(workerDashboardData.findWorkerProfile).mockResolvedValue(mockProfile)
    vi.mocked(userService.getUserRating).mockResolvedValue({ reviewCount: 10, averageRating: 4.5 })
    vi.mocked(workerDashboardData.countWorkerApplications).mockResolvedValue([
      { status: 'Pending', _count: 3 },
      { status: 'Accepted', _count: 2 },
    ])
    vi.mocked(workerDashboardData.countCompletedJobs).mockResolvedValue(5)
    vi.mocked(workerDashboardData.countNewJobsForWorker).mockResolvedValue(8)

    const result = await getWorkerDashboard('worker-1')

    expect(result.profile.id).toBe('worker-1')
    expect(result.profile.name).toBe('Ana')
    expect(result.stats.totalJobs).toBe(5)
    expect(result.stats.reviewCount).toBe(10)
    expect(result.stats.avgRating).toBe(4.5)
    expect(result.stats.newJobs).toBe(8)
    expect(result.stats.pendingApplications).toBe(3)
    expect(result.stats.upcomingAppointments).toBe(2)
  })

  it('throws 404 when worker is not found', async () => {
    vi.mocked(workerDashboardData.findWorkerProfile).mockResolvedValue(null)

    await expect(getWorkerDashboard('nonexistent')).rejects.toMatchObject({ status: 404 })
  })

  it('returns responseRate of 100 when there are no applications', async () => {
    vi.mocked(workerDashboardData.findWorkerProfile).mockResolvedValue(mockProfile)
    vi.mocked(userService.getUserRating).mockResolvedValue({ reviewCount: 0, averageRating: 0 })
    vi.mocked(workerDashboardData.countWorkerApplications).mockResolvedValue([])
    vi.mocked(workerDashboardData.countCompletedJobs).mockResolvedValue(0)
    vi.mocked(workerDashboardData.countNewJobsForWorker).mockResolvedValue(0)

    const result = await getWorkerDashboard('worker-1')

    expect(result.stats.responseRate).toBe(100)
    expect(result.stats.pendingApplications).toBe(0)
  })

  it('calculates responseRate from answered vs total applications', async () => {
    vi.mocked(workerDashboardData.findWorkerProfile).mockResolvedValue(mockProfile)
    vi.mocked(userService.getUserRating).mockResolvedValue({ reviewCount: 0, averageRating: 0 })
    vi.mocked(workerDashboardData.countWorkerApplications).mockResolvedValue([
      { status: 'Pending', _count: 2 },
      { status: 'Accepted', _count: 3 },
      { status: 'Rejected', _count: 5 },
    ])
    vi.mocked(workerDashboardData.countCompletedJobs).mockResolvedValue(0)
    vi.mocked(workerDashboardData.countNewJobsForWorker).mockResolvedValue(0)

    const result = await getWorkerDashboard('worker-1')

    // total=10, pending=2, answered=8, responseRate=80%
    expect(result.stats.responseRate).toBe(80)
  })

  it('passes category ids to countNewJobsForWorker', async () => {
    vi.mocked(workerDashboardData.findWorkerProfile).mockResolvedValue(mockProfile)
    vi.mocked(userService.getUserRating).mockResolvedValue({ reviewCount: 0, averageRating: 0 })
    vi.mocked(workerDashboardData.countWorkerApplications).mockResolvedValue([])
    vi.mocked(workerDashboardData.countCompletedJobs).mockResolvedValue(0)
    vi.mocked(workerDashboardData.countNewJobsForWorker).mockResolvedValue(3)

    await getWorkerDashboard('worker-1')

    expect(workerDashboardData.countNewJobsForWorker).toHaveBeenCalledWith(['cat-1'])
  })

  it('passes through already-rounded avgRating from getUserRating', async () => {
    vi.mocked(workerDashboardData.findWorkerProfile).mockResolvedValue(mockProfile)
    vi.mocked(userService.getUserRating).mockResolvedValue({ reviewCount: 3, averageRating: 4.7 })
    vi.mocked(workerDashboardData.countWorkerApplications).mockResolvedValue([])
    vi.mocked(workerDashboardData.countCompletedJobs).mockResolvedValue(0)
    vi.mocked(workerDashboardData.countNewJobsForWorker).mockResolvedValue(0)

    const result = await getWorkerDashboard('worker-1')

    expect(result.stats.avgRating).toBe(4.7)
  })
})
