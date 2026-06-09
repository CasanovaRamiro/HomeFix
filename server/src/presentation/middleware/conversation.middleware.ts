import type { Request, Response, NextFunction } from 'express'

export const validateConversationBody = (req: Request, res: Response, next: NextFunction): void => {
  const { postId, workerId } = req.body as Record<string, unknown>
  if (!postId || typeof postId !== 'string') {
    res.status(400).json({ error: 'postId is required' })
    return
  }
  if (!workerId || typeof workerId !== 'string') {
    res.status(400).json({ error: 'workerId is required' })
    return
  }
  next()
}

export const validateMessageBody = (req: Request, res: Response, next: NextFunction): void => {
  const { content } = req.body as Record<string, unknown>
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ error: 'content is required' })
    return
  }
  if (content.length > 2000) {
    res.status(400).json({ error: 'Content must not exceed 2000 characters' })
    return
  }
  next()
}
