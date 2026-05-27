import { Router } from 'express'
import { jwtCheck } from '../middleware/auth0.middleware.js'
import { suggestPost } from '../services/ai.service.js'

const router = Router()

router.post('/suggest', jwtCheck, async (req, res, next) => {
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
