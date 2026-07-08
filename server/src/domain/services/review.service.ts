import { logger } from '../../lib/logger.js'
import { findPostById } from '../../infrastructure/database/post.database.js'
import { findAcceptedApplications, findApplicationById } from '../../infrastructure/database/application.database.js'
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

  if (input.applicationId) {
    const application = await findApplicationById(input.applicationId)
    if (!application) {
      throw Object.assign(new Error('Application not found'), { status: 404 })
    }
    if (application.post.userId !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 })
    }

    const isDismissed = application.status === ApplicationStatus.Dismissed
    const isAccepted =
      (application.status === ApplicationStatus.Accepted || application.status === ApplicationStatus.Completed) &&
      (application.post.status === PostStatus.Completed || application.post.status === PostStatus.Cancelled)

    if (!isDismissed && !isAccepted) {
      throw Object.assign(new Error('Application must be dismissed, or accepted and the post completed/cancelled'), {
        status: 400,
      })
    }

    const existing = await findWorkerReviewByApplicationId(input.applicationId)
    if (existing) {
      throw Object.assign(new Error('A review already exists for this application'), { status: 400 })
    }
    const review = await createReviewData({
      applicationId: application.id,
      reviewerId: userId,
      workerId: application.workerId,
      rating: input.rating,
      description: input.description,
      mediaUrls: input.mediaUrls,
    })

    logger.info({ reviewId: review.id, applicationId: input.applicationId, workerId: application.workerId, reviewerId: userId, rating: input.rating, action: 'review.workerCreated' }, 'Worker review created')

    return review
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

  const accepted = await findAcceptedApplications(postId)
  if (accepted.length === 0) {
    throw Object.assign(new Error('No accepted application found for this post'), { status: 400 })
  }
  if (accepted.length > 1) {
    throw Object.assign(new Error('Multiple accepted workers found — specify applicationId'), { status: 400 })
  }

  const review = await createReviewData({
    applicationId: accepted[0].id,
    reviewerId: userId,
    workerId: accepted[0].workerId,
    rating: input.rating,
    description: input.description,
    mediaUrls: input.mediaUrls,
  })

  logger.info({ reviewId: review.id, applicationId: accepted[0].id, workerId: accepted[0].workerId, reviewerId: userId, rating: input.rating, action: 'review.workerCreated' }, 'Worker review created')

  return review
}

export const findWorkerReviewByApplication = async (applicationId: string, userId: string): Promise<DomainWorkerReview> => {
  const application = await findApplicationById(applicationId)
  if (!application) {
    throw Object.assign(new Error('Application not found'), { status: 404 })
  }
  if (application.post.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  const review = await findWorkerReviewByApplicationId(applicationId)
  if (!review) {
    throw Object.assign(new Error('Review not found'), { status: 404 })
  }
  return review
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

  const review = await createClientReviewData({
    applicationId,
    reviewerId: userId,
    clientId,
    rating: input.rating,
    description: input.description,
  })

  logger.info({ reviewId: review.id, applicationId, clientId, reviewerId: userId, rating: input.rating, action: 'review.clientCreated' }, 'Client review created')

  return review
}
