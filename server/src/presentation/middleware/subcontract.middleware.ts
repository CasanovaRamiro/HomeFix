import type { Request, Response, NextFunction } from 'express'

interface PositionInput {
  categoryId?: unknown
  quantity?: unknown
  roleDescription?: unknown
}

export const validateCreateSubcontractBody = (req: Request, res: Response, next: NextFunction): void => {
  const { positions, parentPostId, startDate, endDate, address } = req.body

  if (!Array.isArray(positions) || positions.length === 0) {
    res.status(400).json({ error: 'At least one position is required' })
    return
  }

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i] as PositionInput

    if (!pos.categoryId || typeof pos.categoryId !== 'string' || pos.categoryId.trim() === '') {
      res.status(400).json({ error: `Position ${i + 1}: categoryId is required` })
      return
    }

    if (typeof pos.quantity !== 'number' || !Number.isInteger(pos.quantity) || pos.quantity < 1) {
      res.status(400).json({ error: `Position ${i + 1}: quantity must be a positive integer` })
      return
    }

    if (!pos.roleDescription || typeof pos.roleDescription !== 'string' || pos.roleDescription.trim() === '') {
      res.status(400).json({ error: `Position ${i + 1}: roleDescription is required` })
      return
    }
  }

  if (!parentPostId || typeof parentPostId !== 'string' || parentPostId.trim() === '') {
    if (!startDate || typeof startDate !== 'string' || startDate.trim() === '') {
      res.status(400).json({ error: 'startDate is required when no parentPostId is provided' })
      return
    }
    const sd = new Date(startDate)
    if (isNaN(sd.getTime())) {
      res.status(400).json({ error: 'startDate must be a valid date' })
      return
    }

    if (!endDate || typeof endDate !== 'string' || endDate.trim() === '') {
      res.status(400).json({ error: 'endDate is required when no parentPostId is provided' })
      return
    }
    const ed = new Date(endDate)
    if (isNaN(ed.getTime())) {
      res.status(400).json({ error: 'endDate must be a valid date' })
      return
    }

    if (ed <= sd) {
      res.status(400).json({ error: 'endDate must be after startDate' })
      return
    }

    if (!address || typeof address !== 'string' || address.trim() === '') {
      res.status(400).json({ error: 'address is required when no parentPostId is provided' })
      return
    }
  }

  next()
}
