import api from './api'
import axios from 'axios'

export const AI_JSON_LIMIT_BYTES = 5 * 1024 * 1024
export const MAX_DIAGNOSIS_IMAGE_BYTES = 3 * 1024 * 1024

export class AiPayloadTooLargeError extends Error {
  constructor() {
    super('La imagen o el historial del diagnóstico supera el límite permitido.')
    this.name = 'AiPayloadTooLargeError'
  }
}

export function isAiPayloadTooLargeError(error: unknown): error is AiPayloadTooLargeError {
  return error instanceof AiPayloadTooLargeError
}

export interface AiMessage {
  role: 'user' | 'model'
  text: string
  imageBase64?: string
  mimeType?: string
}

export interface AiQuestionResponse {
  type: 'question'
  text: string
}

export interface AiSuggestionData {
  suggestedTitle: string
  suggestedCategoryId: string
  suggestedCategoryName: string
  possibleIssue: string
  startDate: string | null
  endDate: string | null
  address: string | null
  confidence: 'high' | 'medium' | 'low'
}

export interface AiSuggestionResponse {
  type: 'suggestion'
  data: AiSuggestionData
}

export type AiResponse = AiQuestionResponse | AiSuggestionResponse

export async function sendMessage(messages: AiMessage[]): Promise<AiResponse> {
  const payload = { messages }
  const payloadSize = new TextEncoder().encode(JSON.stringify(payload)).byteLength
  if (payloadSize > AI_JSON_LIMIT_BYTES) throw new AiPayloadTooLargeError()

  const MAX_RETRIES = 1
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data } = await api.post<AiResponse>('/ai/suggest', payload)
      return data
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 413) {
        throw new AiPayloadTooLargeError()
      }
      if (attempt === MAX_RETRIES) throw e
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  throw new Error('No se pudo enviar el mensaje')
}
