import { PostType } from './postType.js'

export interface DomainPost {
  id: string
  userId: string
  type?: PostType
  parentPostId?: string
  subcontractGroupId?: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  address: string
  status: string
  createdAt: Date
  images: { url: string }[]
  latitude: number | null
  longitude: number | null
  isEmergency?: boolean
  emergencyExpiresAt?: Date | null
  allowsSubcontracting?: boolean
  categories: ({ id: string; categoryId?: string; name: string } & {
    quantity?: number
    filledCount?: number
    roleDescription?: string | null
  })[]
  user: { id: string; name: string; surname: string }
  clientRating?: number
  workerRating?: number
  originalClientRating?: number
  parentUser?: { name: string; surname: string }
  postIds?: string[]
  isBidding?: boolean
  bidWeights?: string
  materialResponsibility?: string
  budgetMax?: number
}

export interface DomainUserPost {
  id: string
  title: string
  description: string
  status: string
  createdAt: Date
  address: string
  startDate: Date
  endDate: Date
  categories: { id: string; name: string }[]
  worker: { id: string; name: string } | null
  applicantCount: number
  hasReview: boolean
  isEmergency?: boolean
  emergencyExpiresAt?: Date | null
  isBidding?: boolean
}

export interface CreatePostInput {
  userId: string
  title: string
  description: string
  startDate?: Date | string | null
  endDate?: Date | string | null
  address: string
  latitude?: number | null
  longitude?: number | null
  categoryId: string
  images?: { url: string }[]
  isEmergency?: boolean
  emergencyExpiresAt?: Date | null
  allowsSubcontracting?: boolean
}

export interface UpdatePostInput {
  userId: string
  title: string
  description: string
  startDate?: Date | string | null
  endDate?: Date | string | null
  address: string
  categoryId: string
  isEmergency?: boolean
  emergencyExpiresAt?: Date | null
}

export interface CreateBiddingInput {
  userId: string
  title: string
  description: string
  categoryIds: string[]
  endDate: Date
  budgetMax?: number
  address: string
  latitude?: number | null
  longitude?: number | null
  materialResponsibility: string
  imageUrls: string[]
  bidWeights: string
}

export interface CreateSubcontractCommand {
  userId: string
  parentPostId?: string
  title?: string
  description?: string
  startDate?: Date
  endDate?: Date
  address?: string
  latitude?: number | null
  longitude?: number | null
  positions: {
    categoryId: string
    quantity: number
    roleDescription: string
  }[]
}
