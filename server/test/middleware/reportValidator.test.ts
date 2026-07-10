import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { validateReportBody } from '../../src/presentation/middleware/report.middleware.js'

function createReq(body: Record<string, unknown>): Request {
  return { body } as Request
}

let req: Request
let res: Response
let next: NextFunction
let statusMock: ReturnType<typeof vi.fn>
let jsonMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  req = createReq({ targetType: 'application', reason: 'MAL_COMPORTAMIENTO', applicationId: 'app-1' })
  statusMock = vi.fn().mockReturnThis()
  jsonMock = vi.fn().mockReturnThis()
  res = { status: statusMock, json: jsonMock } as unknown as Response
  next = vi.fn()
})

describe('validateReportBody', () => {
  it('calls next for valid application report body', () => {
    validateReportBody(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(statusMock).not.toHaveBeenCalled()
  })

  it('calls next for valid worker_review body', () => {
    req.body = { targetType: 'worker_review', reason: 'FRAUDE', reviewId: 'review-1' }
    validateReportBody(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('calls next for valid client_review body', () => {
    req.body = { targetType: 'client_review', reason: 'OTRO', reviewId: 'review-2' }
    validateReportBody(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('calls next with optional description', () => {
    req.body = { ...req.body, description: 'Some description' }
    validateReportBody(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('returns 400 if targetType is missing', () => {
    req.body = { reason: 'MAL_COMPORTAMIENTO', applicationId: 'app-1' }
    validateReportBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'targetType is required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 400 if targetType is invalid', () => {
    req.body = { targetType: 'invalid', reason: 'MAL_COMPORTAMIENTO', applicationId: 'app-1' }
    validateReportBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'targetType must be one of: application, worker_review, client_review' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 400 if reason is missing', () => {
    req.body = { targetType: 'application', applicationId: 'app-1' }
    validateReportBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'reason is required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 400 if reason is invalid', () => {
    req.body = { targetType: 'application', reason: 'INVALID_REASON', applicationId: 'app-1' }
    validateReportBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'reason must be one of: MAL_COMPORTAMIENTO, TRABAJO_DEFECTUOSO, INCUMPLIMIENTO, FALTA_DE_RESPETO, FRAUDE, OTRO' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 400 if description is not a string', () => {
    req.body = { ...req.body, description: 123 }
    validateReportBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Description must be a string' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 400 if description exceeds 500 characters', () => {
    req.body = { ...req.body, description: 'a'.repeat(501) }
    validateReportBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Description must not exceed 500 characters' })
    expect(next).not.toHaveBeenCalled()
  })

  it('accepts description with exactly 500 characters', () => {
    req.body = { ...req.body, description: 'a'.repeat(500) }
    validateReportBody(req, res, next)
    expect(next).toHaveBeenCalled()
  })

  it('returns 400 if applicationId is missing for application', () => {
    req.body = { targetType: 'application', reason: 'MAL_COMPORTAMIENTO' }
    validateReportBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'applicationId is required for application reports' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 400 if reviewId is missing for worker_review', () => {
    req.body = { targetType: 'worker_review', reason: 'FRAUDE' }
    validateReportBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'reviewId is required for review reports' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 400 if reviewId is missing for client_review', () => {
    req.body = { targetType: 'client_review', reason: 'OTRO' }
    validateReportBody(req, res, next)
    expect(statusMock).toHaveBeenCalledWith(400)
    expect(jsonMock).toHaveBeenCalledWith({ error: 'reviewId is required for review reports' })
    expect(next).not.toHaveBeenCalled()
  })
})
