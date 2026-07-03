export interface Address {
  street: string
  number: string
  city: string
  state: string
}

export interface DomainClientProfile {
  id: string
  name: string
  surname: string
  email: string
  phone: string | null
  bio: string | null
  role: string
  photo: string | null
  createdAt: Date
  averageRating: number
  reviewCount: number
  completedJobs: number
  address: Address | null
}

export interface UpdateClientProfileInput {
  name?: string
  surname?: string
  phone?: string | null
  bio?: string | null
  photo?: string | null
}
