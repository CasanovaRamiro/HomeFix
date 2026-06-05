import { findApplicationById } from '../../infrastructure/database/application.database.js'
import { createClientReview as createClientReviewData, findClientReviewByApplicationId } from '../../infrastructure/database/clientReview.database.js'
import type { CreateClientReviewInput, DomainClientReview } from '../types/clientReview.types.js'

export const validateClientReviewInput = (input: CreateClientReviewInput) => {
  const rating = Number(input.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw Object.assign(new Error('Rating must be an integer between 1 and 5'), { status: 400 })
  }
  if (input.description && input.description.length > 500) {
    throw Object.assign(new Error('Description must not exceed 500 characters'), { status: 400 })
  }
}

export const createClientReview = async (
  applicationId: string,
  userId: string,
  input: CreateClientReviewInput,
): Promise<DomainClientReview> => {
  validateClientReviewInput(input)

  const application = await findApplicationById(applicationId)
  if (!application) {
    throw Object.assign(new Error('Application not found'), { status: 404 })
  }

  if (application.workerId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }

  if (application.post.status !== 'Completed') {
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
