import swaggerUi from 'swagger-ui-express'
import swaggerDocument from './swaggerDocument.js'

const customCss = `
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
  `

export const swaggerUiHandlers = [
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss,
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
  }),
]
