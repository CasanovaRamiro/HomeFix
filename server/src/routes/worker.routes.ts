import { Router } from 'express'
import { listWorkers, getWorker, getWorkerReviews } from '../services/worker.service.js'

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

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await getWorkerReviews(req.params.id)
    res.json(reviews)
  } catch (err) {
    next(err)
  }
})

export default router
