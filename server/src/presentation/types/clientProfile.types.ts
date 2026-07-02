export interface ClientProfileDTO {
  id: string
  name: string
  surname: string
  bio: string | null
  role: string
  photo: string | null
  createdAt: string
  averageRating: number
  reviewCount: number
  completedJobs: number
  // Owner-only contact fields — omitted entirely for other viewers.
  email?: string
  phone?: string | null
  address?: { street: string; number: string; city: string; state: string } | null
}

export interface UpdateClientProfileRequest {
  name?: string
  surname?: string
  phone?: string | null
  bio?: string | null
  photo?: string | null
}
