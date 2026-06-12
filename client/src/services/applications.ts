import api from './api'
import type { ClientReviewInput } from '../types/clientReview'

export interface ApplicationResponse {
  id: string
  status: string
  message: string
}

export interface PostApplicant {
  applicationId: string
  workerId: string
  name: string
  photo: string | null
  category: string | null
  address: string
  rating: number
  reviewCount: number
  jobCount: number
  status: string
}

export const applyToPost = (postId: string) =>
  api.post<ApplicationResponse>('/applications', { postId })

export const getPostApplicants = (postId: string) =>
  api.get<PostApplicant[]>(`/applications/post/${postId}`)

export const acceptApplication = (applicationId: string): Promise<ApplicationResponse> =>
  api.patch<ApplicationResponse>(`/applications/${applicationId}/accept`).then(r => r.data)

export const createClientReview = (data: ClientReviewInput) =>
  api.post('/reviews/client', data)
