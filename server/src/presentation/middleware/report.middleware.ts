import type { Request, Response, NextFunction } from 'express'

const VALID_TARGET_TYPES = ['application', 'worker_review', 'client_review']
const VALID_REASONS = [
  'MAL_COMPORTAMIENTO',
  'TRABAJO_DEFECTUOSO',
  'INCUMPLIMIENTO',
  'FALTA_DE_RESPETO',
  'FRAUDE',
  'OTRO',
]

const validateDescription = (description: unknown, res: Response): boolean => {
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      res.status(400).json({ error: 'Description must be a string' })
      return false
    }
    if (description.length > 500) {
      res.status(400).json({ error: 'Description must not exceed 500 characters' })
      return false
    }
  }
  return true
}

export const validateReportBody = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.body.targetType || typeof req.body.targetType !== 'string') {
    res.status(400).json({ error: 'targetType is required' })
    return
  }

  if (!VALID_TARGET_TYPES.includes(req.body.targetType)) {
    res.status(400).json({ error: `targetType must be one of: ${VALID_TARGET_TYPES.join(', ')}` })
    return
  }

  if (!req.body.reason || typeof req.body.reason !== 'string') {
    res.status(400).json({ error: 'reason is required' })
    return
  }

  if (!VALID_REASONS.includes(req.body.reason)) {
    res.status(400).json({ error: `reason must be one of: ${VALID_REASONS.join(', ')}` })
    return
  }

  if (!validateDescription(req.body.description, res)) return

  const { targetType } = req.body

  if (targetType === 'application') {
    if (!req.body.applicationId || typeof req.body.applicationId !== 'string') {
      res.status(400).json({ error: 'applicationId is required for application reports' })
      return
    }
  }

  if (targetType === 'worker_review' || targetType === 'client_review') {
    if (!req.body.reviewId || typeof req.body.reviewId !== 'string') {
      res.status(400).json({ error: 'reviewId is required for review reports' })
      return
    }
  }

  next()
}
