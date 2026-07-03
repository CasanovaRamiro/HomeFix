import { Router } from 'express'
import { jwtCheck } from '../middleware/auth0.middleware.js'
import { syncAuth0User } from '../../domain/services/auth.service.js'
import {
  getMyApplications,
  applyToPost,
  applyToSubcontract,
  acceptApplication,
  rejectApplication,
  dismissWorker,
  cancelApplication,
  getPostApplications,
  generateStartToken,
  validateStartToken,
} from '../../domain/services/application.service.js'
import { toMyApplicationDTO, toStartTokenDTO, toStartTokenValidatedDTO } from '../transformers/application.transformer.js'

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
    const { postId, message, availableDays, availableTimeFrom, availableTimeTo, chargesVisit, visitCost } = req.body

    if (!postId || typeof postId !== 'string') {
      res.status(400).json({ error: 'postId is required' })
      return
    }
    if (!Array.isArray(availableDays) || availableDays.length === 0) {
      res.status(400).json({ error: 'availableDays is required and must be a non-empty array' })
      return
    }
    if (!availableTimeFrom || typeof availableTimeFrom !== 'string') {
      res.status(400).json({ error: 'availableTimeFrom is required' })
      return
    }
    if (!availableTimeTo || typeof availableTimeTo !== 'string') {
      res.status(400).json({ error: 'availableTimeTo is required' })
      return
    }
    if (typeof chargesVisit !== 'boolean') {
      res.status(400).json({ error: 'chargesVisit is required and must be a boolean' })
      return
    }

    const result = await applyToPost(user.id, {
      postId,
      message: typeof message === 'string' ? message : undefined,
      availableDays,
      availableTimeFrom,
      availableTimeTo,
      chargesVisit,
      visitCost: typeof visitCost === 'number' ? visitCost : undefined,
    })
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.post('/subcontract', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)
    const { postId, categoryId, message, availableDays, availableTimeFrom, availableTimeTo, visitCost } = req.body
    const chargesVisit = typeof req.body.chargesVisit === 'boolean' ? req.body.chargesVisit : false

    if (!postId || typeof postId !== 'string') {
      res.status(400).json({ error: 'postId is required' })
      return
    }
    if (!categoryId || typeof categoryId !== 'string') {
      res.status(400).json({ error: 'categoryId is required' })
      return
    }

    const result = await applyToSubcontract(user.id, {
      postId,
      categoryId,
      message: typeof message === 'string' ? message : undefined,
      availableDays: Array.isArray(availableDays) ? availableDays : undefined,
      availableTimeFrom: typeof availableTimeFrom === 'string' ? availableTimeFrom : undefined,
      availableTimeTo: typeof availableTimeTo === 'string' ? availableTimeTo : undefined,
      chargesVisit,
      visitCost: typeof visitCost === 'number' ? visitCost : undefined,
    })
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
})

router.patch('/:applicationId/accept', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)
    const { scheduledDate } = (req.body ?? {}) as { scheduledDate?: string }
    const result = await acceptApplication(user.id, req.params.applicationId, scheduledDate)
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

router.patch('/:applicationId/dismiss', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)
    const result = await dismissWorker(user.id, req.params.applicationId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// Worker generates a 4-digit start token to recite in person.
router.post('/:applicationId/start-token', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)
    const result = await generateStartToken(user.id, req.params.applicationId)
    res.json(toStartTokenDTO(result))
  } catch (err) {
    next(err)
  }
})

// Client validates the token the worker gave them in person.
router.post('/:applicationId/validate-start-token', async (req, res, next) => {
  try {
    const claims = req.auth?.payload as { sub?: string; email?: string; role?: string } | undefined
    const user = await syncAuth0User(claims)
    const { token } = (req.body ?? {}) as { token?: string }
    if (typeof token !== 'string' || !/^\d{4}$/.test(token)) {
      res.status(400).json({ error: 'El código debe tener 4 dígitos' })
      return
    }
    const result = await validateStartToken(user.id, req.params.applicationId, token)
    if (!result.valid) {
      res.status(400).json({ error: 'Código incorrecto', attemptsLeft: result.attemptsLeft })
      return
    }
    res.json(toStartTokenValidatedDTO(result.validatedAt))
  } catch (err) {
    next(err)
  }
})

export default router
