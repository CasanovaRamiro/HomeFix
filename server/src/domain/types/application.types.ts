export interface DomainMyApplication {
  id: string
  postId: string
  title: string
  client: string
  location: string
  appliedAt: Date
  serviceDate: Date
  status: string
  category: string | null
}

export interface DomainPostApplication {
  applicationId: string
  workerId: string
  name: string
  category: string | null
  address: string
  rating: number
  reviewCount: number
  jobCount: number
  status: string
}
