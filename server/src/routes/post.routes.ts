import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { post, listMyPosts } from '../services/post.service.js'

const router = Router()

const HARDCODED_USER_ID = 1

router.get('/mine', async (_req, res, next) => {
  try {
    const posts = await listMyPosts(HARDCODED_USER_ID)
    res.json(posts)
  } catch (err) {
    next(err)
  }
})

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