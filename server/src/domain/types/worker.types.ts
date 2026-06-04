export interface DomainWorker {
  id: string
  name: string
  email: string
  phone: string | null
  bio: string | null
  role: string
  createdAt: Date
  categories: { id: string; name: string }[]
}

export interface DomainWorkerReview {
  id: string
  rating: number
  description: string | null
  mediaUrls: string | null
  createdAt: Date
  reviewer: { id: string; name: string }
  application: {
    postId: string
    post: { id: string; title: string }
  }
}
