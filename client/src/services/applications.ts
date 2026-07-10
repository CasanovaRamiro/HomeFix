import api from './api'

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
  scheduledDate: string | null
  hasReview: boolean
  requiresStartToken: boolean
  tokenValidatedAt: string | null
}

export const applyToPost = (input: ApplyToPostInput) =>
  api.post<ApplicationResponse>('/applications', input)

export interface ApplyToSubcontractInput {
  postId: string
  categoryId?: string
  message?: string
  availableDays?: string[]
  availableTimeFrom?: string
  availableTimeTo?: string
  chargesVisit?: boolean
  visitCost?: number
}

export const applyToSubcontract = (input: ApplyToSubcontractInput) =>
  api.post<ApplicationResponse>('/applications/subcontract', input)

export const getPostApplicants = (postId: string) =>
  api.get<PostApplicant[]>(`/applications/post/${postId}`)

export const acceptApplication = (applicationId: string, scheduledDate?: string): Promise<ApplicationResponse> =>
  api.patch<ApplicationResponse>(`/applications/${applicationId}/accept`, { scheduledDate }).then(r => r.data)

export const dismissWorker = (applicationId: string): Promise<ApplicationResponse> =>
  api.patch<ApplicationResponse>(`/applications/${applicationId}/dismiss`).then(r => r.data)

export interface StartTokenResponse {
  token: string
  expiresAt: string
}

export const generateStartToken = (applicationId: string): Promise<StartTokenResponse> =>
  api.post<StartTokenResponse>(`/applications/${applicationId}/start-token`).then(r => r.data)

export const validateStartToken = (applicationId: string, token: string): Promise<{ validatedAt: string }> =>
  api.post<{ validatedAt: string }>(`/applications/${applicationId}/validate-start-token`, { token }).then(r => r.data)

export interface ApplyToBiddingInput {
  postId: string
  offeredCost: number
  offeredDuration?: number
  offeredStartDate?: string
  message?: string
}

export const applyToBidding = (data: ApplyToBiddingInput) =>
  api.post('/applications/bidding', data)

export interface ApplicationDTO {
  id: string
  workerId: string
  workerName: string
  workerPhoto: string | null
  workerPhone: string | null
  workerRating: number
  workerReviewCount: number
  status: string
  message: string | null
  offeredCost: number | null
  offeredDuration: number | null
  offeredStartDate: string | null
  createdAt: string
}

export const fetchBiddingApplications = (biddingId: string) =>
  api.get<ApplicationDTO[]>(`/applications/bidding/${biddingId}`)

export interface MyApplication {
  id: string
  postId: string
  title: string
  client: string
  location: string
  appliedAt: string
  serviceDate: string
  status: 'Accepted' | 'Rejected' | 'Pending' | 'Completed'
  clientPhone: string | null
  availableTimeFrom: string | null
  availableTimeTo: string | null
  isBidding: boolean
}

export const fetchMyApplications = () =>
  api.get<MyApplication[]>('/applications/my-applications')
