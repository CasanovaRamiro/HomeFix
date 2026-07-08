import { findAllWorkers, findWorkerById, updateWorker } from '../../infrastructure/database/worker.database.js'
import { findReviewsByWorkerId } from '../../infrastructure/database/review.database.js'
import { countCompletedJobs, countDismissedJobs } from '../../infrastructure/database/workerDashboard.database.js'
import { deleteImage } from '../../infrastructure/providers/cloudinary.provider.js'
import { getUserRating } from './user.service.js'
import type { DomainWorker, DomainWorkerReview, UpdateWorkerInput } from '../types/worker.types.js'

export interface WorkerStats {
  cancelledJobs: number
  reports: number
  totalJobs: number
  avgRating: number
  reviewCount: number
}

const CLOUDINARY_URL_RE = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/

export const listWorkers = (): Promise<DomainWorker[]> => findAllWorkers()

export const getWorker = async (id: string): Promise<DomainWorker> => {
  const worker = await findWorkerById(id)
  if (!worker) {
    throw Object.assign(new Error('Worker not found'), { status: 404 })
  }
  return worker
}

export const getWorkerStats = async (id: string): Promise<WorkerStats> => {
  const worker = await findWorkerById(id)
  if (!worker) {
    throw Object.assign(new Error('Worker not found'), { status: 404 })
  }

  const [reviewStats, completedJobs, dismissedJobs] = await Promise.all([
    getUserRating(id),
    countCompletedJobs(id),
    countDismissedJobs(id),
  ])

  return {
    cancelledJobs: dismissedJobs,
    reports: 0,
    totalJobs: completedJobs,
    avgRating: reviewStats.averageRating,
    reviewCount: reviewStats.reviewCount,
  }
}

export const updateWorkerProfile = async (id: string, input: UpdateWorkerInput): Promise<DomainWorker> => {
  if (input.photo !== undefined) {
    const current = await findWorkerById(id)
    if (current?.photo && current.photo !== input.photo && CLOUDINARY_URL_RE.test(current.photo)) {
      await deleteImage(current.photo).catch(() => {})
    }
  }
  return updateWorker(id, input)
}

export const getWorkerReviews = async (id: string): Promise<DomainWorkerReview[]> => {
  await getWorker(id)
  return findReviewsByWorkerId(id)
}
