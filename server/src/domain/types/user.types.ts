import { UserRole } from './userRole.js'

export interface DomainUser {
  id: string
  name: string
  email: string
  phone: string | null
  photo: string | null
  role: string
  createdAt: Date
}

export type ReviewTarget = UserRole

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
