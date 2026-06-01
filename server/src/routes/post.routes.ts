import { Router } from 'express'
import { post, getUserPosts, getPostById, finalizePost, listAvailablePosts,searchPostsByDistance } from '../services/post.service.js'
import { syncAuth0User } from '../services/auth.service.js'

const router = Router()


router.get('/', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string } | undefined

    if (!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const user = await syncAuth0User(claims)

    if (user.role !== 'worker') {
      res.status(403).json({ error: 'Worker access required' })
      return
    }

    const result = await listAvailablePosts()
    res.json(result)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.get('/available', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string } | undefined

    if (!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const user = await syncAuth0User(claims)

    if (user.role !== 'worker') {
      res.status(403).json({ error: 'Worker access required' })
      return
    }

    const category = typeof req.query.category === 'string' ? req.query.category : undefined
    const result = await listAvailablePosts(category)
    res.json(result)
  } catch (error) {
    const err = error as Error & { status?: number }
    if (!err.status) err.status = 400
    next(err)
  }
})

router.get('/search-location', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string } | undefined

    if (!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

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
    res.json(posts)
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
    } | undefined
    if(!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const user = await syncAuth0User(claims)
    const result = await post({...req.body, userId: user.id });
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
    next(err)
  }
})

export default router
