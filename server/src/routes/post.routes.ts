import { Router } from 'express'
import { requireAuth, requireWorkerAuth } from '../middleware/auth.middleware.js'
import { syncAuth0User } from '../services/auth.service.js'
import { createPost, getPostById, getUserPosts, finalizePost, listAvailablePosts, searchPostsByDistance } from '../services/post.service.js'

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

router.get('/search-location', requireWorkerAuth, async (req, res) => {
  try {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    const radius = Number(req.query.radius)
    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const posts = await searchPostsByDistance(lat, lng, radius, category)
    res.json(posts)
  } catch (error) {
    const err = error as Error & { status?: number }
    res.status(err.status ?? 400).json({ error: err.message })
  }
})

router.post('/create', requireAuth, async (req, res, next) => {
  try {
    if (!req.body.title?.trim()) {
      res.status(400).json({ error: 'Title is required' })
      return
    }
    const post = await createPost(req.body)
    res.status(201).json(post)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id as string
    const result = await getPostById(id)
    if (!result) return res.status(404).json({ error: 'Post not found' })
    res.json(result)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (err.message === 'Post not found') err.status = 404
    if (!err.status) err.status = 400
    next(err)
  }
})

router.post('/user-posts', requireAuth, async (req, res, next) => {
  try {
    const claims = req.auth?.payload as {
      sub?: string
      email?: string
      name?: string
      nickname?: string
      phone_number?: string
    } | undefined

    if (!claims?.sub) {
      res.status(401).json({ error: "Unauthorized" })
      return
    }

    const user = await syncAuth0User(claims)
    const posts = await getUserPosts(String(user.id))
    res.json(posts)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.patch('/:id/finalize', requireAuth, async (req, res, next) => {
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
    const result = await finalizePost(req.params.id as string, user.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router