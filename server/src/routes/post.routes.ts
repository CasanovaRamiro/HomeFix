import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { post } from '../services/post.service.js'

const router = Router()

router.post('/create', requireAuth, async (req, res, next) => {
  try {
    const result = await post(req.body);
    res.status(201).json(result);
  } catch (error) {
    const err = error as Error & { status?: number };
    if (!err.status) err.status = 400;
    next(err);
  }
})

export default router