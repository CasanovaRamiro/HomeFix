import { Router } from 'express'
import { jwtCheck } from '../middleware/auth0.middleware.js'
import { createHttpError } from '../../lib/errors.js'
import { loginUser, registerUser, registerWorker, syncAuth0User, forgotPassword, resendVerificationEmail } from '../../domain/services/auth.service.js'

const router = Router()

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name?.trim()) throw createHttpError(400, 'El nombre es obligatorio')
    if (!email?.trim()) throw createHttpError(400, 'El correo electrónico es obligatorio')
    if (!password) throw createHttpError(400, 'La contraseña es obligatoria')

    const result = await registerUser(req.body)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/register/worker', async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    if (!name?.trim()) throw createHttpError(400, 'El nombre es obligatorio')
    if (!email?.trim()) throw createHttpError(400, 'El correo electrónico es obligatorio')
    if (!password) throw createHttpError(400, 'La contraseña es obligatoria')

    const result = await registerWorker(req.body)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/resend-verification', async (req, res, next) => {
  try {
    const result = await resendVerificationEmail(req.body.email)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/forgot-password', async (req, res, next) => {
  try {
    const result = await forgotPassword(req.body.email)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const result = await loginUser(req.body)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
})

router.use(jwtCheck)

router.get('/me', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as {
      sub?: string
      email?: string
      name?: string
      nickname?: string
      phone_number?: string
    } | undefined
    const isRegistration = req.headers['x-auth-source'] === 'register'
    const user = await syncAuth0User(claims, isRegistration)
    res.json(user)
  } catch (err) {
    const error = err as Error & { status?: number }
    if (!error.status) error.status = 400
    next(error)
  }
})

export default router
