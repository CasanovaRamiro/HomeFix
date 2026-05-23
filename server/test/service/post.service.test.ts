import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { PostWithCategories } from '../../src/data/post.data.js'

const findAvailablePostsMock = jest.fn<(category?: string) => Promise<PostWithCategories[]>>()
const findPostByIdMock = jest.fn<(id: number) => Promise<PostWithCategories | null>>()

jest.unstable_mockModule('../../src/data/post.data.js', () => ({
  findAvailablePosts: findAvailablePostsMock,
  findPostById: findPostByIdMock,
}))

const { getPostById, listAvailablePosts } = await import('../../src/services/post.service.js')

const mockPost: PostWithCategories = {
  id: 1,
  userId: 2,
  title: 'Cambiar canilla',
  description: 'Pierde agua',
  startDate: new Date('2026-05-20T10:00:00.000Z'),
  endDate: new Date('2026-05-20T12:00:00.000Z'),
  address: 'Calle 123',
  status: 'Active',
  createdAt: new Date('2026-05-19T10:00:00.000Z'),
  image: 'photo.jpg',
  categories: [
    {
      category: {
        id: 1,
        name: 'Plomero',
      },
    },
  ],
}

const expectedPostDTO = {
  id: 1,
  userId: 2,
  title: 'Cambiar canilla',
  description: 'Pierde agua',
  startDate: '2026-05-20T10:00:00.000Z',
  endDate: '2026-05-20T12:00:00.000Z',
  address: 'Calle 123',
  status: 'Active',
  createdAt: '2026-05-19T10:00:00.000Z',
  image: 'photo.jpg',
  categories: [
    {
      category: {
        id: 1,
        name: 'Plomero',
      },
    },
  ],
}

describe('post.service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('listAvailablePosts', () => {
    it('delegates to the data layer with the received category', async () => {
      findAvailablePostsMock.mockResolvedValue([mockPost])

      const result = await listAvailablePosts('Plomero')

      expect(findAvailablePostsMock).toHaveBeenCalledWith('Plomero')
      expect(result).toEqual([expectedPostDTO])
    })
  })

  describe('getPostById', () => {
    it('returns a post when the id exists', async () => {
      findPostByIdMock.mockResolvedValue(mockPost)

      await expect(getPostById(1)).resolves.toEqual(expectedPostDTO)
      expect(findPostByIdMock).toHaveBeenCalledWith(1)
    })

    it('rejects invalid ids before querying the data layer', async () => {
      await expect(getPostById(0)).rejects.toThrow('Post id must be a positive integer')
      await expect(getPostById(1.5)).rejects.toThrow('Post id must be a positive integer')
      expect(findPostByIdMock).not.toHaveBeenCalled()
    })

    it('rejects when the post does not exist', async () => {
      findPostByIdMock.mockResolvedValue(null)

      await expect(getPostById(99)).rejects.toThrow('Post not found')
    })
  })
})
