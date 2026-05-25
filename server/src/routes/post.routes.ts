import { Router } from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { post, getUserPosts } from '../services/post.service.js'

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

router.post("/user-posts", async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: "Invalid userId" });
      return;
    }

    const posts = await getUserPosts(userId);
    res.json(posts);
  } catch (error) {
    const err = error as Error & { status?: number };
    if (!err.status) err.status = 400;
    next(err);
  }
})

export default router