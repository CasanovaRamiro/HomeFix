import prisma from '../../lib/prisma.js'
import { reportSelect } from '../types/report.types.js'
import { toDomainReport } from '../transformers/report.transformer.js'
import type { DomainReport, ReportReason, ReportTargetType } from '../../domain/types/report.types.js'
import type { ReportResult } from '../types/report.types.js'

export const createReport = async (data: {
  reporterId: string
  reportedUserId: string
  reason: ReportReason
  description?: string
  applicationId?: string
  reviewId?: string
  targetType: ReportTargetType
}): Promise<DomainReport> => {
  const raw = await prisma.report.create({
    data: {
      reporterId: data.reporterId,
      reportedUserId: data.reportedUserId,
      reason: data.reason,
      description: data.description ?? null,
      applicationId: data.applicationId ?? null,
      reviewId: data.reviewId ?? null,
      targetType: data.targetType,
    },
    select: reportSelect,
  })
  return toDomainReport(raw)
}

export const findReportByApplicationAndReporter = async (
  applicationId: string,
  reporterId: string,
): Promise<ReportResult | null> => {
  return prisma.report.findFirst({
    where: { applicationId, reporterId },
    select: reportSelect,
  })
}

export const findReportByReviewAndReporter = async (
  reviewId: string,
  reporterId: string,
): Promise<ReportResult | null> => {
  return prisma.report.findFirst({
    where: { reviewId, reporterId },
    select: reportSelect,
  })
}

export const countReportsByWorker = async (workerId: string): Promise<number> => {
  return prisma.report.count({
    where: { reportedUserId: workerId },
  })
}
