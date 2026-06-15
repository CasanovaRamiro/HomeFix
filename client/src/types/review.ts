export interface ReviewInput {
  postId: string
  rating: number
  description?: string
  // Set to review a specific dismissed worker rather than the post's accepted worker.
  applicationId?: string
}
