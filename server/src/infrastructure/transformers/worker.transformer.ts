import type { WorkerResult } from '../database/worker.database.js'
import type { ReviewResult } from '../database/review.database.js'
import type { DomainWorker, DomainWorkerReview } from '../../domain/types/worker.types.js'

export const toDomainWorker = (w: WorkerResult): DomainWorker => ({
  id: w.id,
  name: w.name,
  email: w.email,
  phone: w.phone,
  bio: w.bio,
  role: w.role,
  photo: w.photo,
  createdAt: w.createdAt,
  categories: w.categories.map((uc) => uc.category),
})

export const toDomainWorkerReview = (r: ReviewResult): DomainWorkerReview => ({
  id: r.id,
  rating: r.rating,
  description: r.description,
  mediaUrls: r.mediaUrls,
  createdAt: r.createdAt,
  reviewer: r.reviewer,
  application: r.application,
})
