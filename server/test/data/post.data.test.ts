import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findManyMock, findUniqueMock } = vi.hoisted(() => ({
  findManyMock: vi.fn<(args: unknown) => Promise<unknown[]>>(),
  findUniqueMock: vi.fn<(args: unknown) => Promise<unknown>>(),
}))

vi.mock('../../src/lib/prisma.js', () => ({
  default: {
    post: {
      findMany: findManyMock,
      findUnique: findUniqueMock,
    },
  },
}))

const { findAvailablePosts, findPostById } = await import('../../src/data/post.data.js')

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
