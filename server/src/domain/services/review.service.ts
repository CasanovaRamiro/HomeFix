import { findPostById } from '../../infrastructure/database/post.database.js'
import { findAcceptedApplication } from '../../infrastructure/database/application.database.js'
import { createReview as createReviewData } from '../../infrastructure/database/review.database.js'
import type { CreateReviewInput } from '../types/review.types.js'
import type { DomainWorkerReview } from '../types/worker.types.js'

export const validateReviewInput = (input: CreateReviewInput) => {
  const rating = Number(input.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw Object.assign(new Error('Rating must be an integer between 1 and 5'), { status: 400 })
  }
  if (input.description && input.description.length > 500) {
    throw Object.assign(new Error('Description must not exceed 500 characters'), { status: 400 })
  }
}

export const createReview = async (
  postId: string,
  userId: string,
  input: CreateReviewInput,
): Promise<DomainWorkerReview> => {
  validateReviewInput(input)

  const post = await findPostById(postId)
  if (!post) {
    throw Object.assign(new Error('Post not found'), { status: 404 })
  }
  if (post.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  if (post.status !== 'Completed') {
    throw Object.assign(new Error('Post must be completed before reviewing'), { status: 400 })
  }

  const accepted = await findAcceptedApplication(postId)
  if (!accepted) {
    throw Object.assign(new Error('No accepted application found for this post'), { status: 400 })
  }

  return createReviewData({
    applicationId: accepted.id,
    reviewerId: userId,
    workerId: accepted.workerId,
    rating: input.rating,
    description: input.description,
    mediaUrls: input.mediaUrls,
  })
}
