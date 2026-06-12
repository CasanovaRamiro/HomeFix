export interface DomainUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: Date
}

export type ReviewTarget = 'worker' | 'client'

export interface DomainUserRating {
  averageRating: number
  reviewCount: number
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  phone?: string
  surname?: string
  nationalId?: string
  role?: string
}
