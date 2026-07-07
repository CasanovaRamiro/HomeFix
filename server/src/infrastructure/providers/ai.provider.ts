import { logger } from '../../lib/logger.js'
import { GoogleGenerativeAI, type Content } from '@google/generative-ai'
import { env } from '../../lib/envConfig.js'

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL })

const TIMEOUT_MS = 8000
const MAX_RETRIES = 1

function extractJson(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return (jsonMatch ? jsonMatch[1] : text).trim()
}

export async function generateWithRetry(contents: Content[], systemInstructions: string): Promise<string> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(
        {
          systemInstruction: { role: 'user', parts: [{ text: systemInstructions }] },
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: attempt === MAX_RETRIES ? 0 : undefined,
          },
        },
        { timeout: TIMEOUT_MS },
      )

      const raw = result.response.text()
      const cleaned = extractJson(raw)
      JSON.parse(cleaned)
      return cleaned
    } catch (e) {
      if (attempt === MAX_RETRIES) {
        logger.error({ err: e, action: 'ai.generate' }, 'AI generation failed after retries')
        throw e
      }
    }
  }
  throw new Error('No se pudo generar respuesta')
}
