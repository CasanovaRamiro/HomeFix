import api from './api'

export interface ApplicationResponse {
  id: string
  status: string
  message: string
}

export const applyToPost = (postId: string) =>
  api.post<ApplicationResponse>('/applications', { postId })
