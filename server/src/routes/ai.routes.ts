import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { suggestPost } from '../services/ai.service.js'

const router = Router()

router.post('/suggest', requireAuth, async (req, res, next) => {
  try {
    const result = await suggestPost(req.body)
    res.json(result)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

export default router
