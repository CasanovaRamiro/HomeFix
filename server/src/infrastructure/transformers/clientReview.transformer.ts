import type { ClientReviewResult } from '../database/review.database.js'
import type { DomainClientReview } from '../../domain/types/review.types.js'

export const toDomainClientReview = (r: ClientReviewResult): DomainClientReview => ({
  id: r.id,
  clientId: r.clientId,
  rating: r.rating,
  description: r.description,
  createdAt: r.createdAt,
  reviewer: r.reviewer,
  client: r.client,
})
