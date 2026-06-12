import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindMany = vi.hoisted(() => vi.fn())

vi.mock('../../src/lib/prisma.js', () => ({
  default: {
    category: {
      findMany: mockFindMany,
    },
  },
}))

import { listCategories } from '../../src/domain/services/category.service.js'

beforeEach(() => vi.clearAllMocks())

describe('category.service - listCategories', () => {
  it('calls prisma.category.findMany with the correct order', async () => {
    mockFindMany.mockResolvedValue([])

    await listCategories()

    expect(mockFindMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } })
  })

  it('returns the categories from prisma', async () => {
    const mockCategories = [
      { id: 'uuid-1', name: 'Alpha' },
      { id: 'uuid-2', name: 'Zulu' },
    ]
    mockFindMany.mockResolvedValue(mockCategories)

    const result = await listCategories()

    expect(result).toEqual(mockCategories)
  })

  it('returns an empty array when no categories exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await listCategories()

    expect(result).toEqual([])
  })
})
