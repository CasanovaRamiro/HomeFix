import { findPostById } from '../../infrastructure/database/post.database.js'
import { findAcceptedApplication, findApplicationById } from '../../infrastructure/database/application.database.js'
import { createReview as createReviewData, createClientReview as createClientReviewData, findClientReviewByApplicationId, findWorkerReviewByApplicationId } from '../../infrastructure/database/review.database.js'
import { PostStatus } from '../types/postStatus.js'
import { ApplicationStatus } from '../types/applicationStatus.js'
import type { CreateReviewInput, CreateClientReviewInput, DomainClientReview } from '../types/review.types.js'
import type { DomainWorkerReview } from '../types/worker.types.js'

const validateRating = (rating: unknown) => {
  const num = Number(rating)
  if (!Number.isInteger(num) || num < 1 || num > 5) {
    throw Object.assign(new Error('Rating must be an integer between 1 and 5'), { status: 400 })
  }
}

const validateDescription = (description?: string) => {
  if (description && description.length > 500) {
    throw Object.assign(new Error('Description must not exceed 500 characters'), { status: 400 })
  }
}

export const createWorkerReview = async (
  postId: string,
  userId: string,
  input: CreateReviewInput,
): Promise<DomainWorkerReview> => {
  validateRating(input.rating)
  validateDescription(input.description)

  // Review a specific dismissed worker by application id (the post may still be active).
  if (input.applicationId) {
    const application = await findApplicationById(input.applicationId)
    if (!application) {
      throw Object.assign(new Error('Application not found'), { status: 404 })
    }
    if (application.post.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }
    if (application.status !== ApplicationStatus.Dismissed) {
      throw Object.assign(new Error('Only a dismissed worker can be reviewed this way'), { status: 400 })
    }
    const existing = await findWorkerReviewByApplicationId(input.applicationId)
    if (existing) {
      throw Object.assign(new Error('A review already exists for this application'), { status: 400 })
    }
    return createReviewData({
      applicationId: application.id,
      reviewerId: userId,
      workerId: application.workerId,
      rating: input.rating,
      description: input.description,
      mediaUrls: input.mediaUrls,
    })
  }

  const post = await findPostById(postId)
  if (!post) {
    throw Object.assign(new Error('Post not found'), { status: 404 })
  }
  if (post.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  if (post.status !== PostStatus.Completed && post.status !== PostStatus.Cancelled) {
    throw Object.assign(new Error('Post must be completed or cancelled before reviewing'), { status: 400 })
  }

  // For cancelled posts the accepted-application lookup is what gates reviewability:
  // a post cancelled while still Active never had a hired worker, so it stays non-reviewable.
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

export const createClientReview = async (
  applicationId: string,
  userId: string,
  input: CreateClientReviewInput,
): Promise<DomainClientReview> => {
  validateRating(input.rating)
  validateDescription(input.description)

  const application = await findApplicationById(applicationId)
  if (!application) {
    throw Object.assign(new Error('Application not found'), { status: 404 })
  }

  if (application.workerId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }

  if (application.post.status !== PostStatus.Completed) {
    throw Object.assign(new Error('Post must be completed before reviewing'), { status: 400 })
  }

  const existing = await findClientReviewByApplicationId(applicationId)
  if (existing) {
    throw Object.assign(new Error('A review already exists for this application'), { status: 400 })
  }

  const clientId = application.post.userId

  return createClientReviewData({
    applicationId,
    reviewerId: userId,
    clientId,
    rating: input.rating,
    description: input.description,
  })
}
