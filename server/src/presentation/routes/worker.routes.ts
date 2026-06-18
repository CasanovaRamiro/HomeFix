import { Router } from 'express'
import { listWorkers, getWorker, getWorkerReviews, updateWorkerProfile } from '../../domain/services/worker.service.js'
import { syncAuth0User } from '../../domain/services/auth.service.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const workers = await listWorkers()
    res.json(workers)
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const worker = await getWorker(req.params.id)
    res.json(worker)
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string } | undefined
    if (!claims?.sub) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    let authUser
    try {
      authUser = await syncAuth0User(claims)
    } catch {
      res.status(401).json({ error: 'No encontramos una cuenta con este correo. Por favor registrate primero.' })
      return
    }
    if (authUser.id !== req.params.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const updated = await updateWorkerProfile(req.params.id, req.body)
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await getWorkerReviews(req.params.id)
    res.json(reviews)
  } catch (err) {
    next(err)
  }
})

export default router
