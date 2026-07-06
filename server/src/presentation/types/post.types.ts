export interface PostCategoryDTO {
  id: string
  name: string
  quantity?: number
  filledCount?: number
  roleDescription?: string | null
}

export interface UserPostDTO {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  address: string
  startDate: string
  endDate: string
  categories: PostCategoryDTO[]
  worker: { id: string; name: string } | null
  applicantCount: number
  hasReview: boolean
  isEmergency: boolean
  emergencyExpiresAt: string | null
  isBidding: boolean
}

export interface CreateSubcontractRequest {
  userId: string
  parentPostId?: string
  title?: string
  description?: string
  startDate?: string
  endDate?: string
  address?: string
  latitude?: number | null
  longitude?: number | null
  positions: {
    categoryId: string
    quantity: number
    roleDescription: string
  }[]
}

export interface PostDTO {
  id: string
  userId: string
  type?: string
  parentPostId?: string
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
  status: string
  createdAt: string
  images: { url: string }[]
  latitude: number | null
  longitude: number | null
  isEmergency: boolean
  emergencyExpiresAt: string | null
  allowsSubcontracting: boolean
  categories: PostCategoryDTO[]
  user: {
    id: string
    name: string
    surname: string
  }
  clientRating: number
  workerRating?: number
  originalClientRating?: number
  parentUser?: { name: string; surname: string }
  postIds?: string[]
  isBidding?: boolean
  bidWeights?: string
  materialResponsibility?: string
  budgetMax?: number
}

export interface BiddingApplicationDTO {
  id: string
  workerId: string
  workerName: string
  workerPhoto: string | null
  workerPhone: string | null
  workerRating: number
  workerReviewCount: number
  status: string
  message: string | null
  offeredCost: number | null
  offeredDuration: number | null
  offeredStartDate: string | null
  createdAt: string
}

export interface AvailableBiddingDTO {
  id: string
  title: string
  description: string
  address: string
  budgetMax: number | null
  materialResponsibility: string | null
  images: { id: string; url: string }[]
  latitude: number | null
  longitude: number | null
  categories: { id: string; name: string }[]
  client: { id: string; name: string; surname: string; rating: number; reviewCount: number }
  hasApplied: boolean
  createdAt: string
}

export interface WorkerBiddingDTO {
  applicationId: string
  status: string
  hasReview: boolean
  offeredCost: number | null
  offeredDuration: number | null
  offeredStartDate: string | null
  message: string | null
  createdAt: string
  bidding: {
    id: string
    title: string
    description: string
    budgetMax: number | null
    materialResponsibility: string | null
    status: string
    categories: { id: string; name: string }[]
    client: { id: string; name: string; surname: string }
  }
}
