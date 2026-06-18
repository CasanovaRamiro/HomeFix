export interface CreateApplicationInput {
  postId: string
  message?: string
  availableDays: string[]
  availableTimeFrom: string
  availableTimeTo: string
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
  hasReview: boolean
  clientRating: number
  message: string | null
  availableDays: string[]
  availableTimeFrom: string | null
  availableTimeTo: string | null
  chargesVisit: boolean
  visitCost: number | null
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
}
