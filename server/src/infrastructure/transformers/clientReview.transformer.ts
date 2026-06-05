import type { ClientReviewResult } from '../database/clientReview.database.js'
import type { DomainClientReview } from '../../domain/types/clientReview.types.js'

export const toDomainClientReview = (r: ClientReviewResult): DomainClientReview => ({
  id: r.id,
  rating: r.rating,
  description: r.description,
  createdAt: r.createdAt,
  reviewer: r.reviewer,
  client: r.client,
})
