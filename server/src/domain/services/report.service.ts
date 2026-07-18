import { findApplicationById } from '../../infrastructure/database/application.database.js'
import { findWorkerReviewById, findClientReviewById } from '../../infrastructure/database/review.database.js'
import {
  createReport as createReportData,
  findReportByApplicationAndReporter,
  findReportByReviewAndReporter,
} from '../../infrastructure/database/report.database.js'
import type { CreateReportInput, DomainReport, ReportTargetType } from '../types/report.types.js'

const VALID_TARGET_TYPES: ReportTargetType[] = ['application', 'worker_review', 'client_review']

const validateTargetType = (targetType: unknown): ReportTargetType => {
  if (typeof targetType !== 'string' || !VALID_TARGET_TYPES.includes(targetType as ReportTargetType)) {
    throw Object.assign(new Error('targetType must be one of: application, worker_review, client_review'), { status: 400 })
  }
  return targetType as ReportTargetType
}

export const createReport = async (
  reporterId: string,
  input: CreateReportInput,
): Promise<DomainReport> => {
  const targetType = validateTargetType(input.targetType)

  if (!input.reason) {
    throw Object.assign(new Error('reason is required'), { status: 400 })
  }

  if (targetType === 'application') {
    return createApplicationReport(reporterId, input)
  }

  if (targetType === 'worker_review') {
    return createWorkerReviewReport(reporterId, input)
  }

  return createClientReviewReport(reporterId, input)
}

const createApplicationReport = async (
  reporterId: string,
  input: CreateReportInput,
): Promise<DomainReport> => {
  if (!input.applicationId) {
    throw Object.assign(new Error('applicationId is required for application reports'), { status: 400 })
  }

  const application = await findApplicationById(input.applicationId)
  if (!application) {
    throw Object.assign(new Error('Application not found'), { status: 404 })
  }

  const clientId = application.post.userId
  const workerId = application.workerId

  if (reporterId !== clientId && reporterId !== workerId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }

  if (reporterId === workerId && application.post.userId === workerId) {
    throw Object.assign(new Error('Cannot report yourself'), { status: 400 })
  }

  const reportedUserId = reporterId === clientId ? workerId : clientId

  const existing = await findReportByApplicationAndReporter(input.applicationId, reporterId)
  if (existing) {
    throw Object.assign(new Error('You have already reported this application'), { status: 400 })
  }

  return createReportData({
    reporterId,
    reportedUserId,
    reason: input.reason,
    description: input.description,
    applicationId: input.applicationId,
    targetType: 'application',
  })
}

const createWorkerReviewReport = async (
  reporterId: string,
  input: CreateReportInput,
): Promise<DomainReport> => {
  if (!input.reviewId) {
    throw Object.assign(new Error('reviewId is required for worker_review reports'), { status: 400 })
  }

  const review = await findWorkerReviewById(input.reviewId)
  if (!review) {
    throw Object.assign(new Error('Review not found'), { status: 404 })
  }

  if (reporterId !== review.workerId) {
    throw Object.assign(new Error('Only the reviewed worker can report this review'), { status: 403 })
  }

  const existing = await findReportByReviewAndReporter(input.reviewId, reporterId)
  if (existing) {
    throw Object.assign(new Error('You have already reported this review'), { status: 400 })
  }

  return createReportData({
    reporterId,
    reportedUserId: review.workerId,
    reason: input.reason,
    description: input.description,
    reviewId: input.reviewId,
    targetType: 'worker_review',
  })
}

const createClientReviewReport = async (
  reporterId: string,
  input: CreateReportInput,
): Promise<DomainReport> => {
  if (!input.reviewId) {
    throw Object.assign(new Error('reviewId is required for client_review reports'), { status: 400 })
  }

  const review = await findClientReviewById(input.reviewId)
  if (!review) {
    throw Object.assign(new Error('Review not found'), { status: 404 })
  }

  if (reporterId !== review.clientId) {
    throw Object.assign(new Error('Only the reviewed client can report this review'), { status: 403 })
  }

  const existing = await findReportByReviewAndReporter(input.reviewId, reporterId)
  if (existing) {
    throw Object.assign(new Error('You have already reported this review'), { status: 400 })
  }

  return createReportData({
    reporterId,
    reportedUserId: review.clientId,
    reason: input.reason,
    description: input.description,
    reviewId: input.reviewId,
    targetType: 'client_review',
  })
}
