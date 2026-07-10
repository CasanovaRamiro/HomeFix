import type { ReportResult } from '../types/report.types.js'
import type { DomainReport, ReportReason, ReportTargetType } from '../../domain/types/report.types.js'

export const toDomainReport = (r: ReportResult): DomainReport => ({
  id: r.id,
  reporterId: r.reporterId,
  reportedUserId: r.reportedUserId,
  reason: r.reason as ReportReason,
  description: r.description,
  applicationId: r.applicationId,
  reviewId: r.reviewId,
  targetType: r.targetType as ReportTargetType,
  createdAt: r.createdAt,
})
