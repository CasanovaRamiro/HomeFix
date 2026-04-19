import { Router } from 'express'
import { register, login } from '../services/auth.service.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const result = await register(req.body)
    res.status(201).json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const result = await login(req.body)
    res.json(result)
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
})

export default router
