import type { Content } from '@google/generative-ai'
import { generateWithRetry } from '../../infrastructure/providers/ai.provider.js'
import { listCategories } from '../../infrastructure/database/category.database.js'
import type { AiSuggestRequest, AiResponse } from '../../presentation/types/ai.types.js'
import { logger } from '../../lib/logger.js'

const HISTORY_LIMIT = 6
const CACHE_TTL = 5 * 60 * 1000

let categoriesCache: { id: string; name: string }[] | null = null
let categoriesCacheAt = 0

async function getCachedCategories(): Promise<{ id: string; name: string }[]> {
  if (categoriesCache && Date.now() - categoriesCacheAt < CACHE_TTL) {
    return categoriesCache
  }
  const fresh = await listCategories()
  categoriesCache = fresh
  categoriesCacheAt = Date.now()
  return fresh
}

export const clearCategoryCache = () => {
  categoriesCache = null
  categoriesCacheAt = 0
  logger.info({ action: 'ai.categoryCacheCleared' }, 'Category cache cleared')
}

function isAiResponse(v: unknown): v is AiResponse {
  if (!v || typeof v !== 'object') return false
  const r = v as Record<string, unknown>
  if (r.type === 'question') return typeof r.text === 'string'
  if (r.type === 'suggestion') return !!r.data && typeof r.data === 'object'
  return false
}

function parseAiResponse(raw: string): AiResponse {
  const value: unknown = JSON.parse(raw)
  if (!isAiResponse(value)) {
    throw new Error('Respuesta de IA inválida')
  }
  return value
}

export const suggestPost = async (input: AiSuggestRequest): Promise<AiResponse> => {
  const categories = await getCachedCategories()
  const categoryList = categories.map((c) => `${c.id}: ${c.name}`).join('\n')

  if (!Array.isArray(input?.messages) || input.messages.length === 0) {
    throw Object.assign(new Error('Se requiere al menos un mensaje para generar una sugerencia'), { status: 400 })
  }

  const systemInstructions = `
Sos un asistente de HomeFix, plataforma de servicios del hogar.
Ayudas al cliente a diagnosticar su problema y recomendarle la categoria de profesional adecuada.

Categorias disponibles:
${categoryList}

FLUJO:
1. Primera respuesta: presentate brevemente y hace SOLO 1 pregunta sobre el problema.
2. Segui preguntando hasta que puedas inferir la categoria. Maximo 5 preguntas.
3. Una vez que tengas suficiente informacion, responde con "suggestion".

REGLAS:
- Respuestas cortas (maximo 2 oraciones).
- No preguntes detalles tecnicos irrelevantes.
- No preguntes por fechas ni direccion, el usuario las completa despues en un formulario.
- En possibleIssue: redacta un resumen tecnico del problema, en 3ra persona e impersonal, como un informe
  para el profesional que va a resolverlo. NO es una respuesta de chat.
  - Empieza con "Posible problema de ..." o "Probable ...". Nunca con "Posiblemente tengas", "Tenes" o "Tu".
  - No te dirijas al cliente: prohibi "tenas", "tu", "podes", "podrias", "avisanos", "contanos".
  - Sin preguntas, sin coletazos ("avisame si...", "¿podrias...?") y sin markdown.
  - Maximo 2 oraciones, idealmente 1.
  - Ejemplo correcto: "Posible problema de cañería rota en la cocina que requiera reemplazo del tramo de tubería."
  - Ejemplo incorrecto: "Posiblemente tengas un problema de cañería rota en la cocina que requiera reemplazo del tramo de tubería."
- Sin markdown. SOLO JSON valido. Sin texto extra.

FORMATO PREGUNTA:
{"type":"question","text":"..."}

FORMATO SUGGESTION:
{
  "type":"suggestion",
  "data":{
    "suggestedTitle":"...",
    "suggestedCategoryId": "uuid-string",
    "suggestedCategoryName":"...",
    "possibleIssue":"...",
    "startDate":"ISO string",
    "endDate":"ISO string",
    "address":"...",
    "confidence":"high" | "medium" | "low"
  }
}

confidence: high=muy seguro, medium=bastante seguro, low=poca seguridad.
`

  const windowed = input.messages.slice(-HISTORY_LIMIT)
  while (windowed.length > 0 && windowed[0].role !== 'user') windowed.shift()

  const contents: Content[] = windowed
    .map((msg) => ({
      role: msg.role,
      parts: [
        ...(msg.text ? [{ text: msg.text }] : []),
        ...(msg.imageBase64 && msg.mimeType
          ? [
              {
                inlineData: {
                  data: msg.imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                  mimeType: msg.mimeType,
                },
              },
            ]
          : []),
      ],
    }))

  let response: AiResponse
  try {
    response = await generateWithRetry(contents, systemInstructions, parseAiResponse)
  } catch (e) {
    const err = e as Error & { status?: number }
    err.status = 502
    throw err
  }

  logger.info({ messageCount: input.messages.length, responseType: response.type, action: 'ai.postSuggested' }, 'Post suggestion generated')

  if (response.type === 'suggestion') {
    const valid = categories.find((c) => c.id === response.data.suggestedCategoryId)
    if (!valid) {
      const fallback = categories[0]
      if (!fallback) throw Object.assign(new Error('No hay categorías disponibles'), { status: 400 })
      response.data.suggestedCategoryId = fallback.id
      response.data.suggestedCategoryName = fallback.name
    }
    response.data.startDate = null
    response.data.endDate = null
    response.data.address = null
  }

  return response
}
