import { beforeEach, describe, expect, it, vi } from 'vitest'
import express, { type NextFunction, type Request, type Response } from 'express'
import request from 'supertest'
import type { PostWithCategories } from '../../src/data/post.data.js'

const { listAvailablePostsMock, getPostByIdMock, searchPostsByDistanceMock } = vi.hoisted(() => ({
  listAvailablePostsMock: vi.fn<(category?: string) => Promise<PostWithCategories[]>>(),
  getPostByIdMock: vi.fn<(id: string) => Promise<PostWithCategories>>(),
  searchPostsByDistanceMock: vi.fn<() => Promise<unknown[]>>(),
}))

vi.mock('../../src/services/post.service.js', () => ({
  listAvailablePosts: listAvailablePostsMock,
  getPostById: getPostByIdMock,
  searchPostsByDistance: searchPostsByDistanceMock,
}))

vi.mock('../../src/middleware/auth.middleware.js', () => ({
  requireAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
  requireWorkerAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
}))



const { default: postRoutes } = await import('../../src/routes/post.routes.js')

const app = express()
app.use(express.json())
app.use('/posts', postRoutes)
app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.status ?? 500).json({ error: err.message })
})

const mockPost: PostWithCategories = {
  id: '1',
  userId: '2',
  title: 'Cambiar canilla',
  description: 'Pierde agua',
  startDate: new Date('2026-05-20T10:00:00.000Z'),
  endDate: new Date('2026-05-20T12:00:00.000Z'),
  address: 'Calle 123',
  status: 'Active',
  createdAt: new Date('2026-05-19T10:00:00.000Z'),
  images: [{ url: 'photo.jpg' }],
  latitude: null,
  longitude: null,
  categories: [
    {
      category: {
        id: '1',
        name: 'Plomero',
      },
    },
  ],
}

describe('post.routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /posts/available', () => {
    it('returns available posts for a category', async () => {
      listAvailablePostsMock.mockResolvedValue([mockPost])

      const response = await request(app).get('/posts/available?category=Plomero')

      expect(response.status).toBe(200)
      expect(response.body).toEqual([
        {
          ...mockPost,
          startDate: mockPost.startDate.toISOString(),
          endDate: mockPost.endDate.toISOString(),
          createdAt: mockPost.createdAt.toISOString(),
        },
      ])
      expect(listAvailablePostsMock).toHaveBeenCalledWith('Plomero')
    })

    it('omits the category when the query value is not a string', async () => {
      listAvailablePostsMock.mockResolvedValue([])

      const response = await request(app).get('/posts/available?category=Plomero&category=Gasista')

      expect(response.status).toBe(200)
      expect(listAvailablePostsMock).toHaveBeenCalledWith(undefined)
    })

    it('forwards service errors as bad requests', async () => {
      listAvailablePostsMock.mockRejectedValue(new Error('Could not list posts'))

      const response = await request(app).get('/posts/available')

      expect(response.status).toBe(400)
      expect(response.body).toEqual({ error: 'Could not list posts' })
    })
  })

  describe('GET /posts/search-location', () => {
    it('returns posts filtered by distance', async () => {
      searchPostsByDistanceMock.mockResolvedValue([mockPost])

      const response = await request(app).get('/posts/search-location?lat=-34.6&lng=-58.4&radius=10&category=Plomero')

      expect(response.status).toBe(200)
      expect(searchPostsByDistanceMock).toHaveBeenCalledWith(-34.6, -58.4, 10, 'Plomero')
    })

    it('forwards service errors as bad requests', async () => {
      searchPostsByDistanceMock.mockImplementation(() => Promise.reject(new Error('Invalid radius')))

      const response = await request(app).get('/posts/search-location?lat=-34.6&lng=-58.4&radius=abc')

      expect(response.status).toBe(400)
      expect(response.body).toEqual({ error: 'Invalid radius' })
    })

    it('forwards validation errors', async () => {
      searchPostsByDistanceMock.mockImplementation(() => Promise.reject(new Error('latitude must be between -90 and 90')))

      const response = await request(app).get('/posts/search-location?lat=200&lng=0&radius=10')

      expect(response.status).toBe(400)
    })
  })

  describe('GET /posts/:id', () => {
    it('returns a post by id', async () => {
      getPostByIdMock.mockResolvedValue(mockPost)

      const response = await request(app).get('/posts/1')

      expect(response.status).toBe(200)
      expect(response.body.id).toBe('1')
      expect(getPostByIdMock).toHaveBeenCalledWith('1')
    })

    it('returns 404 when the post does not exist', async () => {
      getPostByIdMock.mockRejectedValue(new Error('Post not found'))

      const response = await request(app).get('/posts/99')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Post not found' })
    })
  })
})
