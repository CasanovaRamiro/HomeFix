import { logger } from './lib/logger.js'

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason instanceof Error ? reason : new Error(String(reason)) }, 'Unhandled rejection')
})

import { env } from './lib/envConfig.js'
import { assertMigrationsApplied } from './lib/assertMigrations.js'
import { jwtCheck } from './presentation/middleware/auth0.middleware.js'

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from './presentation/swagger/swaggerDocument.js'
import authRoutes from './presentation/routes/auth.routes.js'
import userRoutes from './presentation/routes/user.routes.js'
import postRoutes from './presentation/routes/post.routes.js'
import workerRoutes from './presentation/routes/worker.routes.js'
import { errorHandler } from './presentation/middleware/error.middleware.js'
import aiRoutes from './presentation/routes/ai.routes.js'
import categoryRoutes from './presentation/routes/category.routes.js'
import applicationRoutes from './presentation/routes/application.routes.js'
import workerDashboardRoutes from './presentation/routes/workerDashboard.routes.js'
import reviewRoutes from './presentation/routes/review.routes.js'
import kycRoutes, { confirmRouter, webhookRouter } from './presentation/routes/kyc.routes.js'
import uploadRoutes from './presentation/routes/upload.routes.js'
import botRoutes from './presentation/routes/bot.routes.js'
import clientRoutes from './presentation/routes/client.routes.js'
import clientProfileRoutes from './presentation/routes/clientProfile.routes.js'
import { launchBot } from './infrastructure/providers/telegram.provider.js'
import { registerTelegramHandlers } from './presentation/telegram-bot.js'

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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #0F172A }
    .swagger-ui .info .description p { color: #334155 }
    .swagger-ui .scheme-container { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; }
    .swagger-ui .opblock-summary-method { background: #10B981; border-radius: 6px; }
    .swagger-ui .opblock-summary-opblock { border: 1px solid #E2E8F0; border-radius: 8px; }
    .swagger-ui .opblock .opblock-summary { border-radius: 8px; }
    .swagger-ui .btn { border-radius: 6px; }
    .swagger-ui .btn.execute { background: #10B981; border-color: #10B981; }
    .swagger-ui .btn.execute:hover { background: #059669; border-color: #059669; }
    .swagger-ui .model-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; }
    .swagger-ui .tab li { border-radius: 6px 6px 0 0; }
    .swagger-ui .tab li.active { border-bottom-color: #10B981; }
    .swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5 { color: #0F172A; }
    .swagger-ui .response-col_status { color: #10B981; }
    .swagger-ui .response-col_links { color: #64748B; }
    .swagger-ui table thead tr th, .swagger-ui table thead tr td { color: #0F172A; border-bottom: 2px solid #E2E8F0; }
    .swagger-ui .markdown p, .swagger-ui .markdown li { color: #334155; }
    .swagger-ui select { border-radius: 6px; border: 1px solid #E2E8F0; }
    .swagger-ui input[type=text], .swagger-ui textarea { border-radius: 6px; border: 1px solid #E2E8F0; }
    .swagger-ui .dialog-ux .modal-ux { border-radius: 12px; }
    .swagger-ui .arrow { border-color: #10B981; }
    .swagger-ui .expand-operation { color: #10B981; }
    .swagger-ui .opblock-tag { color: #0F172A; border-bottom: 1px solid #E2E8F0; }
    .swagger-ui .opblock-tag:hover { color: #10B981; }
  `,
  customSiteTitle: 'HomeFix API Documentation',
  swaggerOptions: {
    docExpansion: 'list',
    defaultModelsExpandDepth: -1,
    defaultModelExpandDepth: 2,
    displayRequestDuration: true,
    filter: true,
    showExtensions: false,
    showCommonExtensions: false,
    tryItOutEnabled: true,
  },
}))

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
app.use('/telegram', botRoutes)
app.use('/client', jwtCheck, clientRoutes)
app.use('/client-profiles', jwtCheck, clientProfileRoutes)
app.use('/kyc', confirmRouter)
app.use('/kyc', jwtCheck, kycRoutes)
app.use(errorHandler)

if (env.NODE_ENV !== 'test') {
  await assertMigrationsApplied()
  app.listen(PORT, () => {
    logger.info({ port: PORT }, `Server running on port ${PORT}`)
    if (env.TELEGRAM_BOT_TOKEN) launchBot(registerTelegramHandlers)
  })
}
