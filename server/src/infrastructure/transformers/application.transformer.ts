import type { PrismaApplicationWithPost, PrismaApplicationWithWorker } from '../types/application.types.js'
import type { DomainMyApplication, DomainPostApplication } from '../../domain/types/application.types.js'

const parseAvailableDays = (raw: string | null): string[] => {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

export const toDomainMyApplication = (a: PrismaApplicationWithPost): DomainMyApplication => ({
  id: a.id,
  postId: a.postId,
  title: a.post.title,
  client: `${a.post.user.name} ${a.post.user.surname}`.trim(),
  clientId: a.post.user.id,
  clientPhone: a.post.user.phone,
  location: a.post.address,
  appliedAt: a.createdAt,
  serviceDate: a.scheduledDate ?? a.post.startDate,
  endDate: a.post.endDate,
  status: a.status,
  isBidding: a.post.isBidding,
  category: a.category?.category.name ?? a.post.categories[0]?.category.name ?? null,
  categoryId: a.categoryId,
  hasReview: a.clientReview !== null,
  clientRating: 0,
  message: a.message,
  availableDays: parseAvailableDays(a.availableDays),
  availableTimeFrom: a.availableTimeFrom,
  availableTimeTo: a.availableTimeTo,
  chargesVisit: a.chargesVisit,
  visitCost: a.visitCost,
  requiresStartToken: a.requiresStartToken,
  startToken: a.startToken,
  startTokenExpiresAt: a.startTokenExpiresAt,
  tokenValidatedAt: a.tokenValidatedAt,
})

export const toDomainPostApplication = (a: PrismaApplicationWithWorker): DomainPostApplication => {
  const reviews = a.worker.reviewsReceived
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
  const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0

  return {
    applicationId: a.id,
    workerId: a.worker.id,
    name: `${a.worker.name} ${a.worker.surname}`.trim(),
    photo: a.worker.photo,
    category: a.category?.category.name ?? a.worker.categories[0]?.category.name ?? null,
    address: a.worker.address?.city ?? '',
    rating: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length,
    jobCount: a.worker.applications.length,
    status: a.status,
    message: a.message,
    availableDays: parseAvailableDays(a.availableDays),
    availableTimeFrom: a.availableTimeFrom,
    availableTimeTo: a.availableTimeTo,
    chargesVisit: a.chargesVisit,
    visitCost: a.visitCost,
    phone: a.worker.phone,
    scheduledDate: a.scheduledDate ?? null,
    hasReview: a.review !== null,
    requiresStartToken: a.requiresStartToken,
    tokenValidatedAt: a.tokenValidatedAt,
  }
}
