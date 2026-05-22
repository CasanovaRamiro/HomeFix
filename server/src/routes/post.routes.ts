import { Router } from 'express'
import { post, getUserPosts, getPostById, finalizePost } from '../services/post.service.js'
import { syncAuth0User } from '../services/auth.service.js'

const router = Router()

router.post('/create', async (req, res, next) => {
import { requireAuth, requireWorkerAuth } from '../middleware/auth.middleware.js'
import { getPostById, listAvailablePosts } from '../services/post.service.js'

const router = Router()

router.get('/available', requireWorkerAuth, async (req, res, next) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const posts = await listAvailablePosts(category)
    res.json(posts)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
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

router.patch('/:id/finalize', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as {
      sub?: string
      email?: string
      name?: string
      nickname?: string
      phone_number?: string
    } | undefined

    if (!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const user = await syncAuth0User(claims)
    const result = await finalizePost(req.params.id, user.id)
    res.json(result)
  } catch (err) {
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid post id' })
    }
    const result = await getPostById(id)
    res.json(result)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (err.message === 'Post not found') err.status = 404
    if (!err.status) err.status = 400
    next(err)
  }
})

export default router
