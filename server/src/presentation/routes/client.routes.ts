import { Router } from 'express'
import { syncAuth0User } from '../../domain/services/auth.service.js'
import { getClientBiddings } from '../../domain/services/post.service.js'
import { getClientStats } from '../../domain/services/clientStats.service.js'
import { findHistoryPostsByUser } from '../../infrastructure/database/clientHistory.database.js'
import { toPostDTO, toUserPostDTO } from '../transformers/post.transformer.js'

const router = Router()

router.get('/stats', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)
    const stats = await getClientStats(user.id)
    res.json(stats)
  } catch (err) {
    next(err)
  }
})

router.get('/posts', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10))
    const { posts, total } = await findHistoryPostsByUser(user.id, (page - 1) * limit, limit)
    res.json({ data: posts.map(toUserPostDTO), total, page, limit })
  } catch (err) {
    next(err)
  }
})

router.get('/biddings', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)

    if (user.role !== 'client') {
      res.status(403).json({ error: 'Client access required' })
      return
    }

    const result = await getClientBiddings(user.id)
    res.json({
      stats: result.stats,
      biddings: result.biddings.map(toPostDTO),
    })
  } catch (err) {
    next(err)
  }
})

export default router
