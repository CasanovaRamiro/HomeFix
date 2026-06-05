import { Router } from 'express'
import { createReview } from '../../domain/services/review.service.js'
import { syncAuth0User, type Auth0Claims } from '../../domain/services/auth.service.js'
import { validateReviewBody } from '../middleware/review.middleware.js'

const router = Router()

router.post('/', validateReviewBody, async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims
    const user = await syncAuth0User(claims)
    const result = await createReview(req.body.postId, user.id, req.body)
    res.status(201).json(result)
  } catch (error) {
    const err = error as Error & { status?: number; code?: string }
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'Ya dejaste una reseña para este trabajo' })
      return
    }
    if (!err.status) err.status = 400
    next(err)
  }
})

export default router
