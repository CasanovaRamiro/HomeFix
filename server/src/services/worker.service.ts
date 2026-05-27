import { findAllWorkers, findWorkerById } from '../data/worker.data.js'
import { findReviewsByWorkerId } from '../data/review.data.js'

export const listWorkers = (): ReturnType<typeof findAllWorkers> => findAllWorkers()

export const getWorker = async (id: string): Promise<NonNullable<Awaited<ReturnType<typeof findWorkerById>>>> => {
  const worker = await findWorkerById(id)
  if (!worker) {
    const err = Object.assign(new Error('Worker not found'), { status: 404 })
    throw err
  }
  return worker
}

export const getWorkerReviews = async (id: string): ReturnType<typeof findReviewsByWorkerId> => {
  await getWorker(id)
  return findReviewsByWorkerId(id)
}
