import api from './api'
import type { ClientReviewInput } from '../types/clientReview'

export interface ApplicationResponse {
  id: string
  status: string
  message: string
}

export interface ApplyToPostInput {
  postId: string
  categoryId?: string
  message?: string
  availableDays: string[]
  availableTimeFrom: string
  availableTimeTo: string
  chargesVisit: boolean
  visitCost?: number
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
  message: string | null
  availableDays: string[]
  availableTimeFrom: string | null
  availableTimeTo: string | null
  phone: string | null
  chargesVisit: boolean
  visitCost: number | null
  hasReview: boolean
}

export const applyToPost = (input: ApplyToPostInput) =>
  api.post<ApplicationResponse>('/applications', input)

export const applyToSubcontract = (input: ApplyToPostInput) =>
  api.post<ApplicationResponse>('/applications/subcontract', input)

export const getPostApplicants = (postId: string) =>
  api.get<PostApplicant[]>(`/applications/post/${postId}`)

export const acceptApplication = (applicationId: string): Promise<ApplicationResponse> =>
  api.patch<ApplicationResponse>(`/applications/${applicationId}/accept`).then(r => r.data)

export const dismissWorker = (applicationId: string): Promise<ApplicationResponse> =>
  api.patch<ApplicationResponse>(`/applications/${applicationId}/dismiss`).then(r => r.data)

export const createClientReview = (data: ClientReviewInput) =>
  api.post('/reviews/client', data)
