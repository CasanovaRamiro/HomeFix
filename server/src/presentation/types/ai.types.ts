export interface AiMessage {
  role: 'user' | 'model'
  text: string
  imageBase64?: string
  mimeType?: string
}

export interface AiSuggestRequest {
  messages: AiMessage[]
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
