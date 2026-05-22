import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AiSuggestRequest, AiResponse } from '../types/aiSuggestion.js'
import prisma from '../lib/prisma.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

export const suggestPost = async (input: AiSuggestRequest): Promise<AiResponse> => {
  const categories = await prisma.category.findMany()
  const categoryList = categories.map(c => `${c.id}: ${c.name}`).join('\n')

  const systemInstructions = `
Eres un asistente para HomeFix, plataforma de servicios del hogar.
Ayudas al usuario a publicar un pedido de servicio conversando con él.

Categorias disponibles:
${categoryList}

Habla de forma natural y hace UNA pregunta por vez. Cuando tengas toda la info
necesaria, responde con type "suggestion".

RESPONDE SOLO CON JSON VALIDO (sin markdown, sin texto extra):

Si falta info: {"type": "question", "text": "Tu pregunta aqui"}
Si ya tenes todo: {"type": "suggestion", "data": {
  "suggestedTitle": "...",
  "suggestedCategoryId": number,
  "suggestedCategoryName": "...",
  "startDate": "ISO string" | null,
  "endDate": "ISO string" | null,
  "address": "..." | null,
  "confidence": "high" | "medium" | "low"
}}

Niveles de confianza:
- high: todos los campos se infieren claramente
- medium: algunos campos con incertidumbre
- low: falta mucha informacion
`

  const contents = input.messages.map(msg => ({
    role: msg.role,
    parts: [
      ...(msg.text ? [{ text: msg.text }] : []),
      ...(msg.imageBase64 && msg.mimeType
        ? [{
            inlineData: {
              data: msg.imageBase64.replace(/^data:image\/\w+;base64,/, ''),
              mimeType: msg.mimeType,
            },
          }]
        : []),
    ],
  }))

  const result = await model.generateContent({
    systemInstruction: { role: 'user', parts: [{ text: systemInstructions }] },
    contents,
  })

  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Respuesta invalida de la IA')

  const response = JSON.parse(jsonMatch[0]) as AiResponse

  if (response.type === 'suggestion') {
    const valid = categories.find(c => c.id === response.data.suggestedCategoryId)
    if (!valid) {
      response.data.suggestedCategoryId = categories[0]?.id ?? 1
      response.data.suggestedCategoryName = categories[0]?.name ?? 'General'
    }
  }

  return response
}
