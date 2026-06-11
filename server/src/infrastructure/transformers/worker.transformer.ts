import type { WorkerResult } from '../database/worker.database.js'
import type { ReviewResult } from '../database/review.database.js'
import type { DomainWorker, DomainWorkerReview } from '../../domain/types/worker.types.js'

function parseJsonArray(raw: string | null): any[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const toDomainWorker = (w: WorkerResult): DomainWorker => ({
  id: w.id,
  name: w.name,
  email: w.email,
  phone: w.phone,
  bio: w.bio,
  role: w.role,
  photo: w.photo,
  availability: parseJsonArray(w.availability),
  createdAt: w.createdAt,
  categories: w.categories.map((uc) => uc.category),
  certificates: parseJsonArray(w.certificates),
  gallery: parseJsonArray(w.gallery),
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
