import type { PrismaApplicationWithPost, PrismaApplicationWithWorker } from '../types/application.types.js'
import type { DomainMyApplication, DomainPostApplication } from '../../domain/types/application.types.js'

export const toDomainMyApplication = (a: PrismaApplicationWithPost): DomainMyApplication => ({
  id: a.id,
  postId: a.postId,
  title: a.post.title,
  client: `${a.post.user.name} ${a.post.user.surname}`.trim(),
  clientId: a.post.user.id,
  location: a.post.address,
  appliedAt: a.createdAt,
  serviceDate: a.post.startDate,
  status: a.status,
  category: a.post.categories[0]?.category.name ?? null,
  hasReview: a.clientReview !== null,
  clientRating: 0,
})

export const toDomainPostApplication = (a: PrismaApplicationWithWorker): DomainPostApplication => {
  const reviews = a.worker.reviewsReceived
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
  const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0

  return {
    applicationId: a.id,
    workerId: a.worker.id,
    name: `${a.worker.name} ${a.worker.surname}`.trim(),
    category: a.worker.categories[0]?.category.name ?? null,
    address: a.worker.address?.city ?? '',
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length,
    jobCount: a.worker.applications.length,
    status: a.status,
  }
}
