import type { Request, Response, NextFunction } from 'express'

export const validateReviewBody = (req: Request, res: Response, next: NextFunction): void => {
  const { rating, description } = req.body

  if (!req.body.postId || typeof req.body.postId !== 'string') {
    res.status(400).json({ error: 'postId is required' })
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
