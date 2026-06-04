import type { WorkerResult, ReviewResult } from '../types/worker.types.js'
import type { DomainWorker, DomainWorkerReview } from '../../domain/types/worker.types.js'

export const toDomainWorker = (w: WorkerResult): DomainWorker => ({
  id: w.id,
  name: w.name,
  email: w.email,
  phone: w.phone,
  bio: w.bio,
  role: w.role,
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
  jobApplication: r.jobApplication,
})
