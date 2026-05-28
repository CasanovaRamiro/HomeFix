import { Router } from 'express'
import { requireAuth, requireWorkerAuth } from '../middleware/auth.middleware.js'
import { getPostById, listAvailablePosts, searchPostsByDistance } from '../services/post.service.js'

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