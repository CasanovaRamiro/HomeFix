import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/lib/prisma.js', () => ({
  default: { category: { createMany: vi.fn() } },
}))

import prisma from '../../src/lib/prisma.js'
import { initializeCategoryCatalog } from '../../src/infrastructure/database/categoryCatalog.database.js'

beforeEach(() => vi.resetAllMocks())

describe('initializeCategoryCatalog', () => {
  it('adds the eight initial trades without updating or deleting existing data', async () => {
    vi.mocked(prisma.category.createMany).mockResolvedValue({ count: 8 })

    const count = await initializeCategoryCatalog(prisma)

    expect(count).toBe(8)
    expect(prisma.category.createMany).toHaveBeenCalledExactlyOnceWith({
      data: [
        { name: 'Electricidad' }, { name: 'Plomería' }, { name: 'Carpintería' }, { name: 'Pintura' },
        { name: 'Albañilería' }, { name: 'Cerrajería' }, { name: 'Aire / HVAC' }, { name: 'Electrónica' },
      ],
      skipDuplicates: true,
    })
  })

  it('succeeds when the database reports that all categories already exist', async () => {
    vi.mocked(prisma.category.createMany).mockResolvedValue({ count: 0 })
    await expect(initializeCategoryCatalog(prisma)).resolves.toBe(0)
  })

  it('propagates initialization failures so setup cannot report success', async () => {
    const error = new Error('Database unavailable')
    vi.mocked(prisma.category.createMany).mockRejectedValue(error)
    await expect(initializeCategoryCatalog(prisma)).rejects.toBe(error)
  })
})
