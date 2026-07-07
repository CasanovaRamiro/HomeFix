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

export const suggestPost = async (input: AiSuggestRequest): Promise<AiResponse> => {
  const categories = await getCachedCategories()
  const categoryList = categories.map((c) => `${c.id}: ${c.name}`).join('\n')

  if (input.messages.length === 0) {
    throw new Error('Se requiere al menos un mensaje para generar una sugerencia')
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
- En possibleIssue: lenguaje simple, sin certeza absoluta, a modo de resumen de lo hablado.
  Usa: "Posiblemente...", "Probablemente...", "Esto podria deberse a..."
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

  const contents: Content[] = input.messages
    .slice(-HISTORY_LIMIT)
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

  const cleaned = await generateWithRetry(contents, systemInstructions)
  const response = JSON.parse(cleaned) as AiResponse

  logger.info({ messageCount: input.messages.length, responseType: response.type, action: 'ai.postSuggested' }, 'Post suggestion generated')

  if (response.type === 'suggestion') {
    const valid = categories.find((c) => c.id === response.data.suggestedCategoryId)
    if (!valid) {
      response.data.suggestedCategoryId = categories[0]?.id ?? 1
      response.data.suggestedCategoryName = categories[0]?.name ?? 'General'
    }
    response.data.startDate = null
    response.data.endDate = null
    response.data.address = null
  }

  return response
}
