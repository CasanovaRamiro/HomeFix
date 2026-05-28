import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findManyMock, findUniqueMock, queryRawUnsafeMock } = vi.hoisted(() => ({
  findManyMock: vi.fn<(args: unknown) => Promise<unknown[]>>(),
  findUniqueMock: vi.fn<(args: unknown) => Promise<unknown>>(),
  queryRawUnsafeMock: vi.fn<(sql: string, ...params: unknown[]) => Promise<unknown[]>>(),
}))

vi.mock('../../src/lib/prisma.js', () => ({
  default: {
    post: {
      findMany: findManyMock,
      findUnique: findUniqueMock,
    },
    $queryRawUnsafe: queryRawUnsafeMock,
  },
}))

const { findAvailablePosts, findPostById, searchByDistance } = await import('../../src/data/post.data.js')

const postSelect = expect.objectContaining({
  id: true,
  title: true,
  categories: expect.any(Object),
})

describe('post.data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findAvailablePosts', () => {
    it('finds active posts ordered by newest first', async () => {
      findManyMock.mockResolvedValue([])

      await findAvailablePosts()

      expect(findManyMock).toHaveBeenCalledWith({
        where: { status: 'Active' },
        orderBy: { createdAt: 'desc' },
        select: postSelect,
      })
    })

    it('trims and applies a category filter when present', async () => {
      findManyMock.mockResolvedValue([])

      await findAvailablePosts('  Plomero  ')

      expect(findManyMock).toHaveBeenCalledWith({
        where: {
          status: 'Active',
          categories: {
            some: { category: { name: 'Plomero' } },
          },
        },
        orderBy: { createdAt: 'desc' },
        select: postSelect,
      })
    })

    it('ignores blank category values', async () => {
      findManyMock.mockResolvedValue([])

      await findAvailablePosts('   ')

      expect(findManyMock).toHaveBeenCalledWith({
        where: { status: 'Active' },
        orderBy: { createdAt: 'desc' },
        select: postSelect,
      })
    })
  })

  describe('searchByDistance', () => {
    it('queries with haversine and returns posts within radius', async () => {
      const rawRow = { id: 1, distance: 5.2 }
      queryRawUnsafeMock.mockResolvedValue([rawRow])

      const mockedPost = {
        id: 1, userId: 2,
        title: 'Cerca', description: '', address: '',
        startDate: new Date(), endDate: new Date(),
        status: 'Active', createdAt: new Date(), image: '',
        latitude: -34.6, longitude: -58.4,
        categories: [{ category: { id: 1, name: 'Plomero' } }],
      }
      findManyMock.mockResolvedValue([mockedPost])

      const results = await searchByDistance(-34.6, -58.4, 10, 'Plomero')

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe(1)
      expect(results[0].distance).toBe(5.2)
      expect(results[0].categories).toEqual(mockedPost.categories)
      expect(queryRawUnsafeMock).toHaveBeenCalled()
      const sql = queryRawUnsafeMock.mock.calls[0][0] as string
      expect(sql).toContain('HAVING distance <= ?')
      expect(sql).toContain('c2.name = ?')
      expect(findManyMock).toHaveBeenCalledWith({
        where: { id: { in: [1] } },
        select: postSelect,
      })
    })

    it('returns empty array when raw query returns no rows', async () => {
      queryRawUnsafeMock.mockResolvedValue([])

      const results = await searchByDistance(-34.6, -58.4, 10, 'Plomero')

      expect(results).toEqual([])
      expect(findManyMock).not.toHaveBeenCalled()
    })

    it('omits category filter when not provided', async () => {
      queryRawUnsafeMock.mockResolvedValue([])

      await searchByDistance(-34.6, -58.4, 10)

      const sql = queryRawUnsafeMock.mock.calls[0][0] as string
      expect(sql).not.toContain('c2.name = ?')
    })
  })

  describe('findPostById', () => {
    it('finds a post by its id', async () => {
      const mockPost = {
        id: 1,
        title: 'Test',
        categories: [],
      }
      findUniqueMock.mockResolvedValue(mockPost)

      const result = await findPostById(1)

      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { id: 1 },
        select: postSelect,
      })
      expect(result).toEqual(mockPost)
    })
  })
})
