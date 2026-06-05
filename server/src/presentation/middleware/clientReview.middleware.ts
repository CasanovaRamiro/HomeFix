import type { Request, Response, NextFunction } from 'express'

export const validateClientReviewBody = (req: Request, res: Response, next: NextFunction): void => {
  const { rating, description } = req.body

  if (!req.body.applicationId || typeof req.body.applicationId !== 'string') {
    res.status(400).json({ error: 'applicationId is required' })
    return
  }

  const ratingNum = Number(rating)
  if (rating === undefined || rating === null || !Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    res.status(400).json({ error: 'Rating must be an integer between 1 and 5' })
    return
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      res.status(400).json({ error: 'Description must be a string' })
      return
    }
    if (description.length > 500) {
      res.status(400).json({ error: 'Description must not exceed 500 characters' })
      return
    }
  }

  next()
}
