import { Router } from 'express'
import { jwtCheck } from '../middleware/auth0.middleware.js'
import { syncAuth0User } from '../../domain/services/auth.service.js'
import { getClientBiddings } from '../../domain/services/post.service.js'
import { getClientRating } from '../../domain/services/user.service.js'
import { PostStatus } from '../../domain/types/postStatus.js'
import { ApplicationStatus } from '../../domain/types/applicationStatus.js'
import { findHistoryPostsByUser } from '../../infrastructure/database/clientHistory.database.js'
import { toPostDTO, toUserPostDTO } from '../transformers/post.transformer.js'
import prisma from '../../lib/prisma.js'

const router = Router()

router.use(jwtCheck)

router.get('/stats', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)

    const [completedPosts, cancelledPosts, rating] = await Promise.all([
      prisma.post.count({ where: { userId: user.id, status: PostStatus.Completed } }),
      prisma.post.count({ where: { userId: user.id, status: PostStatus.Cancelled } }),
      getClientRating(user.id),
    ])

    const completedWithApps = await prisma.post.findMany({
      where: { userId: user.id, status: PostStatus.Completed },
      include: {
        applications: {
          where: { status: { in: [ApplicationStatus.Accepted, ApplicationStatus.Completed] } },
          include: { review: { select: { id: true } } },
        },
      },
    })

    const unreviewedJobs = completedWithApps.filter(
      (p) => p.applications.some((a) => !a.review)
    ).length

    res.json({ completedPosts, cancelledPosts, unreviewedJobs, clientRating: rating })
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
