import { Router } from 'express'
import { jwtCheck } from '../middleware/auth0.middleware.js'
import { syncAuth0User } from '../services/auth.service.js'
import { getMyApplications, applyToPost } from '../services/application.service.js'

const router = Router()

router.use(jwtCheck)

router.get('/my-applications', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    if (!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const user = await syncAuth0User(claims)
    const result = await getMyApplications(user.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireSession, async (req, res, next) => {
  try {
    const workerId = req.user!.id
    const result = await cancelApplication(workerId, req.params['id'] as string)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    if (!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const user = await syncAuth0User(claims)
    const { postId } = req.body
    if (!postId || typeof postId !== 'string') {
      res.status(400).json({ error: 'postId is required' })
      return
    }
    const result = await applyToPost(user.id, postId)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.patch('/:applicationId/accept', requireSession, async (req, res, next) => {
  try {
    const clientId = req.user!.id
    const applicationId = req.params.applicationId as string
    const result = await acceptApplication(clientId, applicationId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.patch('/:applicationId/reject', requireSession, async (req, res, next) => {
  try {
    const clientId = req.user!.id
    const applicationId = req.params.applicationId as string
    const result = await rejectApplication(clientId, applicationId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
