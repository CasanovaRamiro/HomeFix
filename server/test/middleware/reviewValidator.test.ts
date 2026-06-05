import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { validateReviewBody } from '../../src/presentation/middleware/review.middleware.js'

function createReq(body: Record<string, unknown>): Request {
  return { body } as Request
}

let req: Request
let res: Response
let next: NextFunction
let statusMock: ReturnType<typeof vi.fn>
let jsonMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  req = createReq({ postId: 'post-1', rating: 5, description: 'Great work!' })
  statusMock = vi.fn().mockReturnThis()
  jsonMock = vi.fn().mockReturnThis()
  res = { status: statusMock, json: jsonMock } as unknown as Response
  next = vi.fn()
})

describe('validateReviewBody', () => {
  it('should call next when input is valid', () => {
    validateReviewBody(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(statusMock).not.toHaveBeenCalled()
  })

  it('should call next when description is optional', () => {
    req.body = { postId: 'post-1', rating: 5 }
    validateReviewBody(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('should return 400 when postId is missing', () => {
    req.body = { rating: 5 }
    validateReviewBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'postId is required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 400 when rating is 0', () => {
    req.body = { postId: 'post-1', rating: 0 }
    validateReviewBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Rating must be an integer between 1 and 5' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 400 when rating is 0', () => {
    req.body = { postId: 'post-1', rating: 0 }
    validateReviewBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Rating must be an integer between 1 and 5' })
  })

  it('should return 400 when rating is 6', () => {
    req.body = { postId: 'post-1', rating: 6 }
    validateReviewBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
  })

  it('should return 400 when rating is not an integer', () => {
    req.body = { postId: 'post-1', rating: 3.5 }
    validateReviewBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
  })

  it('should return 400 when description exceeds 500 characters', () => {
    req.body = { postId: 'post-1', rating: 5, description: 'a'.repeat(501) }
    validateReviewBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Description must not exceed 500 characters' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should accept description with exactly 500 characters', () => {
    req.body = { postId: 'post-1', rating: 5, description: 'a'.repeat(500) }
    validateReviewBody(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('should return 400 when description is not a string', () => {
    req.body = { postId: 'post-1', rating: 5, description: 123 }
    validateReviewBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Description must be a string' })
  })
})
