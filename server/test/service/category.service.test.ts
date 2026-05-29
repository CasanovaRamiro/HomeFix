import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/lib/prisma.js', () => ({
  default: {
    category: {
      findMany: vi.fn(),
    },
  },
}))

import prisma from '../../src/lib/prisma.js'
import { listCategories } from '../../src/services/category.service.js'

const mockedFindMany = vi.mocked(prisma.category.findMany)

beforeEach(() => vi.clearAllMocks())

describe('category.service - listCategories', () => {
  it('calls prisma.category.findMany with the correct order', async () => {
    mockedFindMany.mockResolvedValue([])

    await listCategories()

    expect(mockedFindMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } })
  })

  it('returns the categories from prisma', async () => {
    const mockCategories = [
      { id: 'uuid-1', name: 'Alpha' },
      { id: 'uuid-2', name: 'Zulu' },
    ]
    mockedFindMany.mockResolvedValue(mockCategories)

    const result = await listCategories()

    expect(result).toEqual(mockCategories)
  })

  it('returns an empty array when no categories exist', async () => {
    mockedFindMany.mockResolvedValue([])

    const result = await listCategories()

    expect(result).toEqual([])
  })
})
