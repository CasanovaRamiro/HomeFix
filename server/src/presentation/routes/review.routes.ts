import { Router } from 'express'
import { createWorkerReview, createClientReview } from '../../domain/services/review.service.js'
import { syncAuth0User, type Auth0Claims } from '../../domain/services/auth.service.js'
import { validateWorkerReviewBody, validateClientReviewBody } from '../middleware/review.middleware.js'

const router = Router()

router.post('/', validateWorkerReviewBody, async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims
    const user = await syncAuth0User(claims)
    const result = await createWorkerReview(req.body.postId, user.id, req.body)
    res.status(201).json(result)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.post('/client', validateClientReviewBody, async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims
    const user = await syncAuth0User(claims)
    const result = await createClientReview(req.body.applicationId, user.id, req.body)
    res.status(201).json(result)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

export default router
