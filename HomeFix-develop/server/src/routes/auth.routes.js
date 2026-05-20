import { Router } from 'express'
import { register, login } from '../services/auth.service.js'

const router = Router()

router.post('/register', async (req, res, next) => {
  try {
    const result = await register(req.body)
    res.status(201).json(result)
  } catch (err) {
    err.status = 400
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const result = await login(req.body)
    res.json(result)
  } catch (err) {
    err.status = 401
    next(err)
  }
})

export default router
