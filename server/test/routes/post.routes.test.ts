import { beforeEach, describe, expect, it, vi } from 'vitest'
import express, { type NextFunction, type Request, type Response } from 'express'
import request from 'supertest'
import type { PostWithCategories } from '../../src/data/post.data.js'

const { listAvailablePostsMock, getPostByIdMock } = vi.hoisted(() => ({
  listAvailablePostsMock: vi.fn<(category?: string) => Promise<PostWithCategories[]>>(),
  getPostByIdMock: vi.fn<(id: number) => Promise<PostWithCategories>>(),
}))

vi.mock('../../src/middleware/auth.middleware.js', () => ({
  requireAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
  requireWorkerAuth: (_req: Request, _res: Response, next: NextFunction) => next(),
}))

vi.mock('../../src/services/post.service.js', () => ({
  listAvailablePosts: listAvailablePostsMock,
  getPostById: getPostByIdMock,
}))

const { default: postRoutes } = await import('../../src/routes/post.routes.js')

const app = express()
app.use(express.json())
app.use('/posts', postRoutes)
app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.status ?? 500).json({ error: err.message })
})

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

  describe('GET /posts/:id', () => {
    it('returns a post by id', async () => {
      getPostByIdMock.mockResolvedValue(mockPost)

      const response = await request(app).get('/posts/1')

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(1)
      expect(getPostByIdMock).toHaveBeenCalledWith(1)
    })

    it('returns 400 when the id is invalid', async () => {
      const response = await request(app).get('/posts/nope')

      expect(response.status).toBe(400)
      expect(response.body).toEqual({ error: 'Invalid post id' })
      expect(getPostByIdMock).not.toHaveBeenCalled()
    })

    it('returns 404 when the post does not exist', async () => {
      getPostByIdMock.mockRejectedValue(new Error('Post not found'))

      const response = await request(app).get('/posts/99')

      expect(response.status).toBe(404)
      expect(response.body).toEqual({ error: 'Post not found' })
    })
  })
})
