export interface CreateApplicationInput {
  postId: string
  categoryId?: string
  subcontractGroupId?: string
  message?: string
  availableDays?: string[]
  availableTimeFrom?: string
  availableTimeTo?: string
  chargesVisit: boolean
  visitCost?: number
}

export interface DomainMyApplication {
  id: string
  postId: string
  title: string
  client: string
  clientId: string
  clientPhone: string | null
  location: string
  appliedAt: Date
  serviceDate: Date
  endDate: Date
  status: string
  category: string | null
  categoryId: string | null
  hasReview: boolean
  clientReview: { id: string; rating: number; description: string | null; createdAt: Date } | null
  clientRating: number
  message: string | null
  availableDays: string[]
  availableTimeFrom: string | null
  availableTimeTo: string | null
  chargesVisit: boolean
  visitCost: number | null
  requiresStartToken: boolean
  startToken: string | null
  startTokenExpiresAt: Date | null
  tokenValidatedAt: Date | null
}

export interface DomainPostApplication {
  applicationId: string
  workerId: string
  name: string
  photo: string | null
  category: string | null
  address: string
  rating: number
  reviewCount: number
  jobCount: number
  status: string
  message: string | null
  availableDays: string[]
  availableTimeFrom: string | null
  availableTimeTo: string | null
  chargesVisit: boolean
  visitCost: number | null
  phone: string | null
  scheduledDate: Date | null
  hasReview: boolean
  requiresStartToken: boolean
  tokenValidatedAt: Date | null
}

export interface DomainStartToken {
  token: string
  expiresAt: Date
}

export type DomainStartTokenValidation =
  | { valid: true; validatedAt: Date }
  | { valid: false; attemptsLeft: number }
