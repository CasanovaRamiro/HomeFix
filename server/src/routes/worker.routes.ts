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
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid worker id' })
      return
    }
    const worker = await getWorker(id)
    res.json(worker)
  } catch (err) {
    next(err)
  }
})

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid worker id' })
      return
    }
    const reviews = await getWorkerReviews(id)
    res.json(reviews)
  } catch (err) {
    next(err)
  }
})

export default router
