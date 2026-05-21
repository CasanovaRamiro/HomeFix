export const PUBLICATION_STATUSES = {
  AVAILABLE: 'disponible',
  PENDING: 'pendiente',
  IN_PROGRESS: 'en_progreso',
  COMPLETED: 'completada',
  CANCELLED: 'cancelada',
} as const

export type PublicationStatus =
  (typeof PUBLICATION_STATUSES)[keyof typeof PUBLICATION_STATUSES]

export const PUBLICATION_STATUS_VALUES = Object.values(
  PUBLICATION_STATUSES
) as PublicationStatus[]

export type CreatePublicationInput = {
  description: string
  typePublication: string
  fromStartJob: Date
  untilFinishJob: Date
  photo: string
  status?: PublicationStatus
}

export type UpdatePublicationInput = {
  description?: string
  typePublication?: string
  fromStartJob?: Date
  untilFinishJob?: Date
  photo?: string
  status?: PublicationStatus
}
