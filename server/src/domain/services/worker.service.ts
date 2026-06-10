import { findAllWorkers, findWorkerById, updateWorker } from '../../infrastructure/database/worker.database.js'
import { findReviewsByWorkerId } from '../../infrastructure/database/review.database.js'
import type { DomainWorker, DomainWorkerReview, UpdateWorkerInput } from '../types/worker.types.js'

export const listWorkers = (): Promise<DomainWorker[]> => findAllWorkers()

export const getWorker = async (id: string): Promise<DomainWorker> => {
  const worker = await findWorkerById(id)
  if (!worker) {
    throw Object.assign(new Error('Worker not found'), { status: 404 })
  }
  return worker
}

export const updateWorkerProfile = async (id: string, input: UpdateWorkerInput): Promise<DomainWorker> => {
  return updateWorker(id, input)
}

export const getWorkerReviews = async (id: string): Promise<DomainWorkerReview[]> => {
  await getWorker(id)
  return findReviewsByWorkerId(id)
}
