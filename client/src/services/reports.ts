import api from './api'

export type ReportReason =
  | 'MAL_COMPORTAMIENTO'
  | 'TRABAJO_DEFECTUOSO'
  | 'INCUMPLIMIENTO'
  | 'FALTA_DE_RESPETO'
  | 'FRAUDE'
  | 'OTRO'

export type ReportTargetType = 'application' | 'worker_review' | 'client_review'

export interface CreateReportInput {
  targetType: ReportTargetType
  reason: ReportReason
  description?: string
  applicationId?: string
  reviewId?: string
}

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'MAL_COMPORTAMIENTO', label: 'Mal comportamiento' },
  { value: 'TRABAJO_DEFECTUOSO', label: 'Trabajo defectuoso' },
  { value: 'INCUMPLIMIENTO', label: 'Incumplimiento' },
  { value: 'FALTA_DE_RESPETO', label: 'Falta de respeto' },
  { value: 'FRAUDE', label: 'Fraude' },
  { value: 'OTRO', label: 'Otro' },
]

export const createReport = (input: CreateReportInput) =>
  api.post('/reports', input)
