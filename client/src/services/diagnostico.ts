import api from './api'

export interface AiMessage {
  role: 'user' | 'model'
  text: string
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
  const { data } = await api.post<AiResponse>('/ai/suggest', { messages })
  return data
}
