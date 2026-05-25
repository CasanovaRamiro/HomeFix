import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/data/worker.data.js', () => ({
  findAllWorkers: vi.fn(),
  findWorkerById: vi.fn(),
}))

import * as workerData from '../../src/data/worker.data.js'
import { listWorkers, getWorker } from '../../src/services/worker.service.js'

const mockWorker = {
  id: 1,
  name: 'Ana',
  email: 'ana@test.com',
  phone: null as string | null,
  role: 'worker',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  categories: [
    { category: { id: 1, name: 'Plumbing' } },
  ],
}

beforeEach(() => vi.clearAllMocks())

describe('worker.service - listWorkers', () => {
  it('returns all workers from the data layer', async () => {
    vi.mocked(workerData.findAllWorkers).mockResolvedValue([mockWorker])

    const result = await listWorkers()

    expect(workerData.findAllWorkers).toHaveBeenCalledTimes(1)
    expect(result).toEqual([mockWorker])
  })

  it('returns an empty array when there are no workers', async () => {
    vi.mocked(workerData.findAllWorkers).mockResolvedValue([])

    const result = await listWorkers()

    expect(result).toEqual([])
  })

})

describe('worker.service - getWorker', () => {
  it('returns the worker when found', async () => {
    vi.mocked(workerData.findWorkerById).mockResolvedValue(mockWorker)

    const result = await getWorker(1)

    expect(workerData.findWorkerById).toHaveBeenCalledWith(1)
    expect(result).toEqual(mockWorker)
  })

  it('throws when the worker does not exist', async () => {
    vi.mocked(workerData.findWorkerById).mockResolvedValue(null)

    await expect(getWorker(9999)).rejects.toThrow('Worker not found')
  })
})
