import { Router } from 'express'
import { listUsers, getUserReviews, getUserRating, setEmergencyNotifications, setRequiresStartToken } from '../../domain/services/user.service.js'
import { syncAuth0User } from '../../domain/services/auth.service.js'
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

router.patch('/:id/emergencies', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string } | undefined
    if (!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const authUser = await syncAuth0User(claims)
    if (authUser.id !== req.params.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const { enabled } = req.body
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'enabled must be a boolean' })
      return
    }
    const result = await setEmergencyNotifications(authUser.id, enabled)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/start-token-setting', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string } | undefined
    if (!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const authUser = await syncAuth0User(claims)
    if (authUser.id !== req.params.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const { enabled } = req.body
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'enabled must be a boolean' })
      return
    }
    const result = await setRequiresStartToken(authUser.id, enabled)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
