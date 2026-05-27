import { Router } from 'express'
import { post, getUserPosts, getPostById } from '../services/post.service.js'
import { syncAuth0User } from '../services/auth.service.js'

const router = Router()

router.post('/create', async (req, res, next) => {
  try {
    const result = await post(req.body);
    res.status(201).json(result);
  } catch (error) {
    const err = error as Error & { status?: number };
    if (!err.status) err.status = 400;
    next(err);
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const result = await getPostById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Post not found' });
    res.json(result);
  } catch (error) {
    const err = error as Error & { status?: number };
    if (!err.status) err.status = 400;
    next(err);
  }
})

router.post("/user-posts", async (req, res, next) => {
  try {
    const claims = req.auth?.payload as {
      sub?: string
      email?: string
      name?: string
      nickname?: string
      phone_number?: string
    } | undefined

    if (!claims?.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await syncAuth0User(claims);
    const posts = await getUserPosts(user.id);
    res.json(posts);
  } catch (error) {
    const err = error as Error & { status?: number };
    if (!err.status) err.status = 400;
    next(err);
  }
})

export default router
