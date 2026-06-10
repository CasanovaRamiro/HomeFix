import { env } from './lib/envConfig.js'
import { assertMigrationsApplied } from './lib/assertMigrations.js'
import { jwtCheck } from './presentation/middleware/auth0.middleware.js'

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import authRoutes from './presentation/routes/auth.routes.js'
import userRoutes from './presentation/routes/user.routes.js'
import postRoutes from './presentation/routes/post.routes.js'
import workerRoutes from './presentation/routes/worker.routes.js'
import { errorHandler } from './presentation/middleware/error.middleware.js'
import postRoutes from './presentation/routes/post.routes.js'
import aiRoutes from './presentation/routes/ai.routes.js'
import categoryRoutes from './presentation/routes/category.routes.js'
import applicationRoutes from './presentation/routes/application.routes.js'
import workerDashboardRoutes from './presentation/routes/workerDashboard.routes.js'
import reviewRoutes from './presentation/routes/review.routes.js'
import kycRoutes, { confirmRouter, webhookRouter } from './presentation/routes/kyc.routes.js'
import uploadRoutes from './presentation/routes/upload.routes.js'
import telegramRoutes from './presentation/routes/telegram.routes.js'
import { startBot } from './presentation/telegram/bot.js'

export const app = express()
const PORT = env.PORT

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      rawBody?: string
    }
  }
}

app.use(cors({ origin: env.CORS_ORIGIN }))
app.use(express.json({
  verify: (req, _res, buf) => {
    if (buf && buf.length) {
      Object.assign(req, { rawBody: buf.toString('utf8') })
    }
  },
}))
app.use(morgan('dev'))

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/auth', authRoutes)

app.use('/users', jwtCheck, userRoutes)
app.use('/posts', jwtCheck, postRoutes)
app.use('/workers', jwtCheck, workerRoutes)
app.use('/ai', aiRoutes)
app.use('/categories', categoryRoutes)
app.use('/applications', applicationRoutes)
app.use('/worker-dashboard', jwtCheck, workerDashboardRoutes)
app.use('/reviews', jwtCheck, reviewRoutes)
app.use('/kyc', webhookRouter)
app.use('/upload', jwtCheck, uploadRoutes)
app.use('/telegram', telegramRoutes)
app.use('/kyc', confirmRouter)
app.use('/kyc', jwtCheck, kycRoutes)
app.use(errorHandler)

if (env.NODE_ENV !== 'test') {
  await assertMigrationsApplied()
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    if (env.TELEGRAM_BOT_TOKEN) startBot()
  })
}
