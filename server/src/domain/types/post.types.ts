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
  categories: { id: string; name: string }[]
  user: { id: string; name: string; surname: string }
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
}

export interface CreatePostInput {
  userId: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  address: string
  categoryId: string
}

export interface UpdatePostInput {
  userId: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  address: string
  categoryId: string
}
