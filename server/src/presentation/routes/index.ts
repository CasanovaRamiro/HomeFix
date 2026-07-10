import type { Express } from 'express'
import { jwtCheck } from '../middleware/auth0.middleware.js'

import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import postRoutes from './post.routes.js'
import workerRoutes from './worker.routes.js'
import aiRoutes from './ai.routes.js'
import categoryRoutes from './category.routes.js'
import applicationRoutes from './application.routes.js'
import workerDashboardRoutes from './workerDashboard.routes.js'
import reviewRoutes from './review.routes.js'
import uploadRoutes from './upload.routes.js'
import botRoutes from './bot.routes.js'
import clientRoutes from './client.routes.js'
import clientProfileRoutes from './clientProfile.routes.js'
import reportRoutes from './report.routes.js'
import kycRoutes, { confirmRouter, webhookRouter } from './kyc.routes.js'

export function registerRoutes(app: Express): void {
  app.get('/health', (_req, res) => res.json({ status: 'ok' }))

  app.use('/auth', authRoutes)
  app.use('/users', jwtCheck, userRoutes)
  app.use('/posts', jwtCheck, postRoutes)
  app.use('/workers', jwtCheck, workerRoutes)
  app.use('/ai', jwtCheck, aiRoutes)
  app.use('/categories', categoryRoutes)
  app.use('/applications', jwtCheck, applicationRoutes)
  app.use('/worker-dashboard', jwtCheck, workerDashboardRoutes)
  app.use('/reviews', jwtCheck, reviewRoutes)
  app.use('/upload', jwtCheck, uploadRoutes)
  app.use('/telegram', jwtCheck, botRoutes)
  app.use('/client', jwtCheck, clientRoutes)
  app.use('/client-profiles', jwtCheck, clientProfileRoutes)
  app.use('/reports', jwtCheck, reportRoutes)

  // KYC spans three auth contexts: public webhook, public (rate-limited)
  // confirm, and authenticated session/status endpoints.
  app.use('/kyc', webhookRouter)
  app.use('/kyc', confirmRouter)
  app.use('/kyc', jwtCheck, kycRoutes)
}
