import { Router } from 'express'
import { jwtCheck } from '../middleware/auth0.middleware.js'
import { syncAuth0User } from '../../domain/services/auth.service.js'
import {
  getMyApplications,
  applyToPost,
  acceptApplication,
  rejectApplication,
  cancelApplication,
  getPostApplications,
} from '../../domain/services/application.service.js'
import { toMyApplicationDTO } from '../transformers/application.transformer.js'

const router = Router()

router.use(jwtCheck)

router.get('/post/:postId', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)
    const result = await getPostApplications(user.id, req.params.postId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.get('/my-applications', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)
    const result = await getMyApplications(user.id)
    res.json(result.map(toMyApplicationDTO))
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)
    const result = await cancelApplication(user.id, req.params.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
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

router.patch('/:applicationId/accept', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)
    const result = await acceptApplication(user.id, req.params.applicationId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

router.patch('/:applicationId/reject', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)
    const result = await rejectApplication(user.id, req.params.applicationId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
