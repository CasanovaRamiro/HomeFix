export enum ReportReason {
  MalComportamiento = 'MAL_COMPORTAMIENTO',
  TrabajoDefectuoso = 'TRABAJO_DEFECTUOSO',
  Incumplimiento = 'INCUMPLIMIENTO',
  FaltaDeRespeto = 'FALTA_DE_RESPETO',
  Fraude = 'FRAUDE',
  Otro = 'OTRO',
}

export type ReportTargetType = 'application' | 'worker_review' | 'client_review'

export interface DomainReport {
  id: string
  reporterId: string
  reportedUserId: string
  reason: ReportReason
  description: string | null
  applicationId: string | null
  reviewId: string | null
  targetType: ReportTargetType
  createdAt: Date
}

export interface CreateReportInput {
  reason: ReportReason
  description?: string
  applicationId?: string
  reviewId?: string
  targetType: ReportTargetType
}
