import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/infrastructure/database/application.database.js', () => ({
  findApplicationById: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/review.database.js', () => ({
  findWorkerReviewById: vi.fn(),
  findClientReviewById: vi.fn(),
}))

vi.mock('../../src/infrastructure/database/report.database.js', () => ({
  createReport: vi.fn(),
  findReportByApplicationAndReporter: vi.fn(),
  findReportByReviewAndReporter: vi.fn(),
  countReportsByWorker: vi.fn(),
}))

import * as applicationData from '../../src/infrastructure/database/application.database.js'
import * as reviewData from '../../src/infrastructure/database/review.database.js'
import * as reportData from '../../src/infrastructure/database/report.database.js'
import { createReport } from '../../src/domain/services/report.service.js'
import { ReportReason } from '../../src/domain/types/report.types.js'

const mockReport = {
  id: 'report-1',
  reporterId: 'client-1',
  reportedUserId: 'worker-1',
  reason: ReportReason.MalComportamiento,
  description: null as string | null,
  applicationId: 'app-1' as string | null,
  reviewId: null as string | null,
  targetType: 'application' as const,
  createdAt: new Date(),
}

const mockApplication = {
  id: 'app-1',
  workerId: 'worker-1',
  post: { userId: 'client-1', title: 'Fix pipes', status: 'Completed', type: 'standard', isBidding: false, subcontractGroupId: null },
  category: { id: 'cat-1', quantity: 1, filledCount: 0 },
}

const mockWorkerReview = {
  id: 'review-1',
  workerId: 'worker-1',
  rating: 5,
  description: 'Great work',
  createdAt: new Date(),
}

const mockClientReview = {
  id: 'review-2',
  clientId: 'client-1',
  rating: 4,
  description: 'Good client',
  createdAt: new Date(),
}

beforeEach(() => vi.clearAllMocks())

describe('report.service - createReport', () => {
  it('throws 400 if targetType is invalid', async () => {
    await expect(
      createReport('user-1', { targetType: 'invalid' as never, reason: ReportReason.MalComportamiento }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('throws 400 if targetType is missing', async () => {
    await expect(
      createReport('user-1', { targetType: undefined as never, reason: ReportReason.MalComportamiento }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('throws 400 if reason is missing', async () => {
    await expect(
      createReport('user-1', { targetType: 'application', reason: undefined as never }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('delegates to application report for targetType application', async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication as never)
    vi.mocked(reportData.findReportByApplicationAndReporter).mockResolvedValue(null)
    vi.mocked(reportData.createReport).mockResolvedValue(mockReport)

    await createReport('client-1', {
      targetType: 'application',
      reason: ReportReason.MalComportamiento,
      applicationId: 'app-1',
    })

    expect(applicationData.findApplicationById).toHaveBeenCalledWith('app-1')
    expect(reportData.createReport).toHaveBeenCalled()
  })

  it('delegates to worker_review report for targetType worker_review', async () => {
    vi.mocked(reviewData.findWorkerReviewById).mockResolvedValue(mockWorkerReview as never)
    vi.mocked(reportData.findReportByReviewAndReporter).mockResolvedValue(null)
    vi.mocked(reportData.createReport).mockResolvedValue({ ...mockReport, targetType: 'worker_review', reviewId: 'review-1', applicationId: null })

    await createReport('worker-1', {
      targetType: 'worker_review',
      reason: ReportReason.Fraude,
      reviewId: 'review-1',
    })

    expect(reviewData.findWorkerReviewById).toHaveBeenCalledWith('review-1')
    expect(reportData.createReport).toHaveBeenCalled()
  })

  it('delegates to client_review report for targetType client_review', async () => {
    vi.mocked(reviewData.findClientReviewById).mockResolvedValue(mockClientReview as never)
    vi.mocked(reportData.findReportByReviewAndReporter).mockResolvedValue(null)
    vi.mocked(reportData.createReport).mockResolvedValue({ ...mockReport, targetType: 'client_review', reviewId: 'review-2', applicationId: null })

    await createReport('client-1', {
      targetType: 'client_review',
      reason: ReportReason.Incumplimiento,
      reviewId: 'review-2',
    })

    expect(reviewData.findClientReviewById).toHaveBeenCalledWith('review-2')
    expect(reportData.createReport).toHaveBeenCalled()
  })
})

describe('report.service - createApplicationReport', () => {
  it('throws 400 if applicationId is missing', async () => {
    await expect(
      createReport('client-1', { targetType: 'application', reason: ReportReason.MalComportamiento }),
    ).rejects.toMatchObject({ status: 400, message: 'applicationId is required for application reports' })
  })

  it('throws 404 if application not found', async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(null)

    await expect(
      createReport('client-1', { targetType: 'application', reason: ReportReason.MalComportamiento, applicationId: 'non-existent' }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('throws 403 if reporter is neither client nor worker', async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication as never)

    await expect(
      createReport('outsider-1', { targetType: 'application', reason: ReportReason.MalComportamiento, applicationId: 'app-1' }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('throws 400 if reporter reports themselves', async () => {
    const selfApp = { ...mockApplication, workerId: 'client-1', post: { ...mockApplication.post, userId: 'client-1' } }
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(selfApp as never)

    await expect(
      createReport('client-1', { targetType: 'application', reason: ReportReason.MalComportamiento, applicationId: 'app-1' }),
    ).rejects.toMatchObject({ status: 400, message: 'Cannot report yourself' })
  })

  it('throws 400 if duplicate report exists', async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication as never)
    vi.mocked(reportData.findReportByApplicationAndReporter).mockResolvedValue(mockReport as never)

    await expect(
      createReport('client-1', { targetType: 'application', reason: ReportReason.MalComportamiento, applicationId: 'app-1' }),
    ).rejects.toMatchObject({ status: 400, message: 'You have already reported this application' })
  })

  it('creates report when client reports worker', async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication as never)
    vi.mocked(reportData.findReportByApplicationAndReporter).mockResolvedValue(null)
    vi.mocked(reportData.createReport).mockResolvedValue(mockReport)

    const result = await createReport('client-1', {
      targetType: 'application',
      reason: ReportReason.MalComportamiento,
      applicationId: 'app-1',
    })

    expect(reportData.createReport).toHaveBeenCalledWith({
      reporterId: 'client-1',
      reportedUserId: 'worker-1',
      reason: ReportReason.MalComportamiento,
      description: undefined,
      applicationId: 'app-1',
      targetType: 'application',
    })
    expect(result).toEqual(mockReport)
  })

  it('creates report when worker reports client', async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication as never)
    vi.mocked(reportData.findReportByApplicationAndReporter).mockResolvedValue(null)
    vi.mocked(reportData.createReport).mockResolvedValue({ ...mockReport, reporterId: 'worker-1', reportedUserId: 'client-1' })

    const result = await createReport('worker-1', {
      targetType: 'application',
      reason: ReportReason.Fraude,
      applicationId: 'app-1',
    })

    expect(reportData.createReport).toHaveBeenCalledWith({
      reporterId: 'worker-1',
      reportedUserId: 'client-1',
      reason: ReportReason.Fraude,
      description: undefined,
      applicationId: 'app-1',
      targetType: 'application',
    })
    expect(result.reportedUserId).toBe('client-1')
  })
})

describe('report.service - createWorkerReviewReport', () => {
  it('throws 400 if reviewId is missing', async () => {
    await expect(
      createReport('worker-1', { targetType: 'worker_review', reason: ReportReason.Fraude }),
    ).rejects.toMatchObject({ status: 400, message: 'reviewId is required for worker_review reports' })
  })

  it('throws 404 if review not found', async () => {
    vi.mocked(reviewData.findWorkerReviewById).mockResolvedValue(null)

    await expect(
      createReport('worker-1', { targetType: 'worker_review', reason: ReportReason.Fraude, reviewId: 'non-existent' }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('throws 403 if reporter is not the reviewed worker', async () => {
    vi.mocked(reviewData.findWorkerReviewById).mockResolvedValue(mockWorkerReview as never)

    await expect(
      createReport('other-worker', { targetType: 'worker_review', reason: ReportReason.Fraude, reviewId: 'review-1' }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('throws 400 if duplicate report exists', async () => {
    vi.mocked(reviewData.findWorkerReviewById).mockResolvedValue(mockWorkerReview as never)
    vi.mocked(reportData.findReportByReviewAndReporter).mockResolvedValue(mockReport as never)

    await expect(
      createReport('worker-1', { targetType: 'worker_review', reason: ReportReason.Fraude, reviewId: 'review-1' }),
    ).rejects.toMatchObject({ status: 400, message: 'You have already reported this review' })
  })

  it('creates worker review report successfully', async () => {
    vi.mocked(reviewData.findWorkerReviewById).mockResolvedValue(mockWorkerReview as never)
    vi.mocked(reportData.findReportByReviewAndReporter).mockResolvedValue(null)
    const expected = { ...mockReport, targetType: 'worker_review' as const, reviewId: 'review-1', applicationId: null }
    vi.mocked(reportData.createReport).mockResolvedValue(expected)

    const result = await createReport('worker-1', {
      targetType: 'worker_review',
      reason: ReportReason.Fraude,
      reviewId: 'review-1',
      description: 'Fake review',
    })

    expect(reportData.createReport).toHaveBeenCalledWith({
      reporterId: 'worker-1',
      reportedUserId: 'worker-1',
      reason: ReportReason.Fraude,
      description: 'Fake review',
      reviewId: 'review-1',
      targetType: 'worker_review',
    })
    expect(result).toEqual(expected)
  })
})

describe('report.service - createClientReviewReport', () => {
  it('throws 400 if reviewId is missing', async () => {
    await expect(
      createReport('client-1', { targetType: 'client_review', reason: ReportReason.Otro }),
    ).rejects.toMatchObject({ status: 400, message: 'reviewId is required for client_review reports' })
  })

  it('throws 404 if review not found', async () => {
    vi.mocked(reviewData.findClientReviewById).mockResolvedValue(null)

    await expect(
      createReport('client-1', { targetType: 'client_review', reason: ReportReason.Otro, reviewId: 'non-existent' }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('throws 403 if reporter is not the reviewed client', async () => {
    vi.mocked(reviewData.findClientReviewById).mockResolvedValue(mockClientReview as never)

    await expect(
      createReport('other-client', { targetType: 'client_review', reason: ReportReason.Otro, reviewId: 'review-2' }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('throws 400 if duplicate report exists', async () => {
    vi.mocked(reviewData.findClientReviewById).mockResolvedValue(mockClientReview as never)
    vi.mocked(reportData.findReportByReviewAndReporter).mockResolvedValue(mockReport as never)

    await expect(
      createReport('client-1', { targetType: 'client_review', reason: ReportReason.Otro, reviewId: 'review-2' }),
    ).rejects.toMatchObject({ status: 400, message: 'You have already reported this review' })
  })

  it('creates client review report successfully', async () => {
    vi.mocked(reviewData.findClientReviewById).mockResolvedValue(mockClientReview as never)
    vi.mocked(reportData.findReportByReviewAndReporter).mockResolvedValue(null)
    const expected = { ...mockReport, targetType: 'client_review' as const, reviewId: 'review-2', applicationId: null }
    vi.mocked(reportData.createReport).mockResolvedValue(expected)

    const result = await createReport('client-1', {
      targetType: 'client_review',
      reason: ReportReason.Otro,
      reviewId: 'review-2',
    })

    expect(reportData.createReport).toHaveBeenCalledWith({
      reporterId: 'client-1',
      reportedUserId: 'client-1',
      reason: ReportReason.Otro,
      description: undefined,
      reviewId: 'review-2',
      targetType: 'client_review',
    })
    expect(result).toEqual(expected)
  })
})
