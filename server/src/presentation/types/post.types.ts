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
}
