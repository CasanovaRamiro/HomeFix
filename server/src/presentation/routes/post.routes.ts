import { Router } from 'express'
import {
  createPost,
  createSubContract,
  getUserPosts,
  getPostById,
  finalizePost,
  pausePost,
  cancelPost,
  listAvailablePosts,
  findAvailableSubcontracts,
  listEmergencyPosts,
  searchPostsByDistance,
  completePost,
  reopenPost,
  updatePost,
} from '../../domain/services/post.service.js'
import { syncAuth0User } from '../../domain/services/auth.service.js'
import type { Auth0Claims } from '../../domain/services/auth.service.js'
import { toPostDTO, toUserPostDTO } from '../transformers/post.transformer.js'
import { validateCreateSubcontractBody } from '../middleware/subcontract.middleware.js'
import type { CreateSubcontractRequest } from '../types/post.types.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)

    if (user.role !== 'worker') {
      res.status(403).json({ error: 'Worker access required' })
      return
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10))
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await listAvailablePosts(undefined, { page, limit, sortOrder })
    res.json({ ...result, data: result.data.map(toPostDTO) })
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.get('/available', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)

    if (user.role !== 'worker') {
      res.status(403).json({ error: 'Worker access required' })
      return
    }

    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10))
    const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc'

    const result = await listAvailablePosts(category, { page, limit, sortOrder })
    res.json({ ...result, data: result.data.map(toPostDTO) })
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.get('/emergency', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)

    if (user.role !== 'worker') {
      res.status(403).json({ error: 'Worker access required' })
      return
    }

    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const result = await listEmergencyPosts(category)
    res.json(result.map(toPostDTO))
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.get('/search-location', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)

    if (user.role !== 'worker') {
      res.status(403).json({ error: 'Worker access required' })
      return
    }

    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    const radius = Number(req.query.radius)
    const category = typeof req.query.category === 'string' ? req.query.category : undefined

    const posts = await searchPostsByDistance(lat, lng, radius, category)
    res.json(posts.map(toPostDTO))
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.get('/availableSubcontracts', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)

    if (user.role !== 'worker') {
      res.status(403).json({ error: 'Worker access required' })
      return
    }

    const result = await findAvailableSubcontracts()
    res.json(result.map(toPostDTO))
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.post('/create', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as {
      sub?: string
      email?: string
      name?: string
      nickname?: string
      phone_number?: string
      role?: string
    } | undefined
    if (!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const user = await syncAuth0User(claims)
    const result = await createPost({ ...req.body, userId: user.id })
    res.status(201).json(toPostDTO(result))
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.post('/create-subcontract', validateCreateSubcontractBody, async (req, res, next) => {
  try {
    const claims = req.auth?.payload as Auth0Claims | undefined
    const user = await syncAuth0User(claims)
    const body = req.body as CreateSubcontractRequest
    const result = await createSubContract({
      ...body,
      userId: user.id,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    })
    res.status(201).json(toPostDTO(result))
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const result = await getPostById(req.params.id)
    if (!result) return res.status(404).json({ error: 'Post not found' })
    res.json(toPostDTO(result))
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.post('/user-posts', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as {
      sub?: string
      email?: string
      name?: string
      nickname?: string
      phone_number?: string
      role?: string
    } | undefined
    const user = await syncAuth0User(claims)
    const posts = await getUserPosts(user.id)
    res.json(posts.map(toUserPostDTO))
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.patch('/:id/pause', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as {
      sub?: string
      email?: string
      name?: string
      nickname?: string
      phone_number?: string
      role?: string
    } | undefined
    const user = await syncAuth0User(claims)
    const result = await pausePost(req.params.id, user.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as {
      sub?: string
      email?: string
      name?: string
      nickname?: string
      phone_number?: string
      role?: string
    } | undefined
    const user = await syncAuth0User(claims)
    const result = await cancelPost(req.params.id, user.id)
    res.json(result)
  } catch (err) {
    next(err)
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
      role?: string
    } | undefined
    const user = await syncAuth0User(claims)
    const result = await finalizePost(req.params.id, user.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/complete', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    if (!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const user = await syncAuth0User(claims)
    const result = await completePost(req.params.id, user.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/reopen', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    if (!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const user = await syncAuth0User(claims)
    const result = await reopenPost(req.params.id, user.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    if (!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const user = await syncAuth0User(claims)
    const result = await updatePost(req.params.id, user.id, req.body)
    res.json(toPostDTO(result))
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

export default router
