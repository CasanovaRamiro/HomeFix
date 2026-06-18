export interface CreateReviewInput {
  postId: string
  rating: number
  description?: string
  mediaUrls?: string
  // When set, reviews this specific application (used to review a dismissed worker)
  // instead of resolving the accepted worker from the post.
  applicationId?: string
}

export interface DomainClientReview {
  id: string
  rating: number
  description: string | null
  createdAt: Date
  reviewer: { id: string; name: string }
  client: { id: string; name: string }
}

export interface CreateClientReviewInput {
  applicationId: string
  rating: number
  description?: string
}
