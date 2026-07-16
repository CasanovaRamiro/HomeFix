import api from './api'

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
  const MAX_RETRIES = 1
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data } = await api.post<AiResponse>('/ai/suggest', { messages })
      return data
    } catch (e) {
      if (attempt === MAX_RETRIES) throw e
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  throw new Error('No se pudo enviar el mensaje')
}
