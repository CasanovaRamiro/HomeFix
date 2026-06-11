export interface DomainPost {
  id: string
  userId: string
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
  categories: { id: string; name: string }[]
  user: { id: string; name: string; surname: string }
  clientRating?: number
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
