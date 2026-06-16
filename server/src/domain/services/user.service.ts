import { findAll, findClientReviewsByUserId, findWorkerReviewsByUserId, getWorkerReviewAggregate, getClientReviewAggregate, updateEmergencyNotifications } from '../../infrastructure/database/user.database.js'
import type { DomainClientReview } from '../types/review.types.js'
import type { DomainWorkerReview } from '../types/worker.types.js'
import type { DomainUserRating, ReviewTarget } from '../types/user.types.js'
import { UserRole } from '../types/userRole.js'

export const listUsers = () => findAll()

export const getUserReviews = (
  userId: string,
  as?: ReviewTarget,
): Promise<DomainWorkerReview[] | DomainClientReview[]> => {
  if (as === UserRole.Client) return findClientReviewsByUserId(userId)
  if (as === UserRole.Worker) return findWorkerReviewsByUserId(userId)
  return Promise.resolve([])
}

export const getClientRating = async (userId: string): Promise<DomainUserRating> => {
  const agg = await getClientReviewAggregate(userId)
  const averageRating = agg._count > 0 ? Math.round((agg._avg.rating ?? 0) * 10) / 10 : 0
  return { averageRating, reviewCount: agg._count }
}

export const getWorkerRating = async (userId: string): Promise<DomainUserRating> => {
  const agg = await getWorkerReviewAggregate(userId)
  const averageRating = agg._count > 0 ? Math.round((agg._avg.rating ?? 0) * 10) / 10 : 0
  return { averageRating, reviewCount: agg._count }
}

export const getUserRating = async (userId: string): Promise<DomainUserRating> => {
  const [workerAgg, clientAgg] = await Promise.all([
    getWorkerReviewAggregate(userId),
    getClientReviewAggregate(userId),
  ])

  const totalCount = workerAgg._count + clientAgg._count
  const workerTotal = (workerAgg._avg.rating ?? 0) * workerAgg._count
  const clientTotal = (clientAgg._avg.rating ?? 0) * clientAgg._count
  const averageRating = totalCount > 0 ? Math.round(((workerTotal + clientTotal) / totalCount) * 10) / 10 : 0

  return { averageRating, reviewCount: totalCount }
}

export const setEmergencyNotifications = (userId: string, enabled: boolean) =>
  updateEmergencyNotifications(userId, enabled)
