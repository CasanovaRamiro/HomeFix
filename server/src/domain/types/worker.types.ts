export interface DomainWorker {
  id: string
  name: string
  email: string
  phone: string | null
  bio: string | null
  role: string
  photo: string | null
  availability: string[]
  createdAt: Date
  categories: { id: string; name: string }[]
}

export interface UpdateWorkerInput {
  name?: string
  phone?: string | null
  bio?: string | null
  photo?: string | null
  categoryIds?: string[]
  availability?: string[]
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
