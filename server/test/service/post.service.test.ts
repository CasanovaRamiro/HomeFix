import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PostWithCategories } from '../../src/data/post.data.js'

const { findAvailablePostsMock, findPostByIdMock, searchByDistanceMock } = vi.hoisted(() => ({
  findAvailablePostsMock: vi.fn<(category?: string) => Promise<PostWithCategories[]>>(),
  findPostByIdMock: vi.fn<(id: number) => Promise<PostWithCategories | null>>(),
  searchByDistanceMock: vi.fn<
    (lat: number, lng: number, radiusKm: number, category?: string) => Promise<unknown[]>
  >(),
}))

vi.mock('../../src/data/post.data.js', () => ({
  findAvailablePosts: findAvailablePostsMock,
  findPostById: findPostByIdMock,
  searchByDistance: searchByDistanceMock,
}))

const { getPostById, listAvailablePosts, searchPostsByDistance } = await import('../../src/services/post.service.js')

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
  latitude: null,
  longitude: null,
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
  latitude: null,
  longitude: null,
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
    vi.clearAllMocks()
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

  describe('searchPostsByDistance', () => {
    const lat = -34.6, lng = -58.4, radius = 10

    it('returns posts sorted by distance', async () => {
      searchByDistanceMock.mockResolvedValue([{
        ...mockPost, latitude: -34.6, longitude: -58.4, distance: 5.2,
      }])

      const results = await searchPostsByDistance(lat, lng, radius, 'Plomero')

      expect(results).toHaveLength(1)
      expect(results[0].latitude).toBe(-34.6)
      expect(searchByDistanceMock).toHaveBeenCalledWith(lat, lng, radius, 'Plomero')
    })

    it('validates coordinate ranges', async () => {
      await expect(searchPostsByDistance(100, 0, 10)).rejects.toThrow('latitude must be between -90 and 90')
      await expect(searchPostsByDistance(0, 200, 10)).rejects.toThrow('longitude must be between -180 and 180')
    })

    it('validates radius range', async () => {
      await expect(searchPostsByDistance(0, 0, 0)).rejects.toThrow('radius must be between 1 and 1000 km')
      await expect(searchPostsByDistance(0, 0, 1001)).rejects.toThrow('radius must be between 1 and 1000 km')
    })

    it('requires numeric parameters', async () => {
      await expect(searchPostsByDistance(NaN, 0, 10)).rejects.toThrow('lat, lng, and radius must be finite numbers')
    })
  })
})
