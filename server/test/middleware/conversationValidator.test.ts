import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { validateConversationBody, validateMessageBody } from '../../src/presentation/middleware/conversation.middleware.js'

function createReq(body: Record<string, unknown>): Request {
  return { body } as Request
}

let req: Request
let res: Response
let next: NextFunction
let statusMock: ReturnType<typeof vi.fn>
let jsonMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  req = createReq({ postId: 'post-1', workerId: 'worker-1' })
  statusMock = vi.fn().mockReturnThis()
  jsonMock = vi.fn().mockReturnThis()
  res = { status: statusMock, json: jsonMock } as unknown as Response
  next = vi.fn()
})

describe('validateConversationBody', () => {
  it('should call next when input is valid', () => {
    validateConversationBody(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(statusMock).not.toHaveBeenCalled()
  })

  it('should return 400 when postId is missing', () => {
    req.body = { workerId: 'worker-1' }
    validateConversationBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'postId is required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 400 when workerId is missing', () => {
    req.body = { postId: 'post-1' }
    validateConversationBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'workerId is required' })
    expect(next).not.toHaveBeenCalled()
  })
})

describe('validateMessageBody', () => {
  it('should call next when input is valid', () => {
    req = createReq({ content: 'Hello' })
    validateMessageBody(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(statusMock).not.toHaveBeenCalled()
  })

  it('should return 400 when content is missing', () => {
    req.body = {}
    validateMessageBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'content is required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 400 when content is empty', () => {
    req.body = { content: '' }
    validateMessageBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 400 when content exceeds 2000 characters', () => {
    req.body = { content: 'a'.repeat(2001) }
    validateMessageBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Content must not exceed 2000 characters' })
    expect(next).not.toHaveBeenCalled()
  })

  it('should accept content with exactly 2000 characters', () => {
    req.body = { content: 'a'.repeat(2000) }
    validateMessageBody(req, res, next)
    expect(next).toHaveBeenCalled()
  })
})
