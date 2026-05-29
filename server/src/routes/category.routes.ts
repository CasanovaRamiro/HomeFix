import { Router } from 'express'
import { listCategories } from '../services/category.service.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const categories = await listCategories()
    res.json(categories)
  } catch (error) {
    next(error)
  }
})

export default router
