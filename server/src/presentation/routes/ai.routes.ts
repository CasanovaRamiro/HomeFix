import { Router } from 'express'
import { suggestPost } from '../../domain/services/ai.service.js'

const router = Router()

router.post('/suggest', async (req, res, next) => {
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
