import { Router } from 'express'
import { listUsers, getUserReviews, getUserRating } from '../../domain/services/user.service.js'
import type { ReviewTarget } from '../../domain/types/user.types.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const users = await listUsers()
    res.json(users)
  } catch (err) {
    next(err)
  }
})

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const as = req.query.as as ReviewTarget | undefined
    const reviews = await getUserReviews(req.params.id, as)
    res.json(reviews)
  } catch (err) {
    next(err)
  }
})

router.get('/:id/rating', async (req, res, next) => {
  try {
    const rating = await getUserRating(req.params.id)
    res.json(rating)
  } catch (err) {
    next(err)
  }
})

export default router
