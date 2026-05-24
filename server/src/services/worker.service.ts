import { findAllWorkers, findWorkerById } from '../data/worker.data.js'

export const listWorkers = (): ReturnType<typeof findAllWorkers> => findAllWorkers()

export const getWorker = async (id: number): Promise<NonNullable<Awaited<ReturnType<typeof findWorkerById>>>> => {
  const worker = await findWorkerById(id)
  if (!worker) {
    const err = Object.assign(new Error('Worker not found'), { status: 404 })
    throw err
  }
  return worker
}
