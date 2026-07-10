import api from './api'
import type { Post, PostStatus, CreateSubcontractInput, SubcontractDTO, AvailableSubcontractDTO, SubcontractDetailDTO } from '../types/post'

export interface PaginatedPosts {
  data: Post[]
  total: number
  page: number
  totalPages: number
}

export interface FeedParams {
  page: number
  limit: number
  sortOrder: 'asc' | 'desc'
}

export const fetchWorkerFeed = (params: FeedParams) =>
  api.get<PaginatedPosts>('/posts', { params })

export const fetchAvailablePosts = (category?: string, pagination?: FeedParams) =>
  api.get<PaginatedPosts>('/posts/available', {
    params: {
      ...(category?.trim() ? { category: category.trim() } : {}),
      ...(pagination ?? {}),
    },
  })

export const fetchEmergencyPosts = (category?: string) =>
  api.get<Post[]>('/posts/emergency', {
    params: category?.trim() ? { category: category.trim() } : undefined,
  })

export const searchPostsByLocation = (lat: number, lng: number, radius: number, category?: string) =>
  api.get<Post[]>('/posts/search-location', {
    params: { lat, lng, radius, ...(category?.trim() ? { category: category.trim() } : {}) },
  })

export const fetchPostById = (id: string) =>
  api.get<Post>(`/posts/${id}`)

export const createSubcontract = (data: CreateSubcontractInput) =>
  api.post<SubcontractDTO>('/posts/create-subcontract', data)

export const fetchAvailableSubcontracts = () =>
  api.get<AvailableSubcontractDTO[]>('/posts/availableSubcontracts')

export const fetchSubcontractById = (id: string) =>
  api.get<SubcontractDetailDTO>(`/posts/subcontracts/${id}`)

export interface SubcontractManagerData {
  stats: {
    active: number
    inProgress: number
    paused: number
    completed: number
    averageRating: number
    reviewCount: number
  }
  subcontracts: SubcontractDetailDTO[]
}

export const fetchMySubcontractManager = () =>
  api.get<SubcontractManagerData>('/posts/subcontracts/my-subcontracts')

export const fetchSubcontractGroupDetail = (id: string) =>
  api.get<SubcontractDetailDTO>(`/posts/subcontracts/group/${id}`)

// --- Bidding types & services ---

export interface CreateBiddingInput {
  title: string
  description: string
  categoryIds: string[]
  endDate: string
  budgetMin?: number
  budgetMax?: number
  address: string
  latitude: number | null
  longitude: number | null
  materialResponsibility: string
  imageUrls: string[]
  bidWeights: string
}

export const createBidding = (data: CreateBiddingInput) =>
  api.post<Post>('/posts/create-bidding', data)

export const fetchBiddingById = (id: string) =>
  api.get<Post>(`/posts/biddings/${id}`)

export const selectBiddingWinner = (biddingId: string, applicationId: string) =>
  api.post(`/posts/biddings/${biddingId}/select-winner`, { applicationId })

export interface AvailableBiddingDTO {
  id: string
  title: string
  description: string
  address: string
  budgetMax: number | null
  materialResponsibility: string | null
  images: { id: string; url: string }[]
  latitude: number | null
  longitude: number | null
  categories: { id: string; name: string }[]
  client: { id: string; name: string; surname: string; rating: number; reviewCount: number }
  hasApplied: boolean
  endDate: string
  createdAt: string
}

export interface WorkerBiddingDTO {
  applicationId: string
  status: string
  hasReview: boolean
  offeredCost: number | null
  offeredDuration: number | null
  offeredStartDate: string | null
  message: string | null
  createdAt: string
  bidding: {
    id: string
    title: string
    description: string
    budgetMax: number | null
    materialResponsibility: string | null
    status: string
    categories: { id: string; name: string }[]
    client: { id: string; name: string; surname: string }
  }
}

export const fetchAvailableBiddings = () =>
  api.get<AvailableBiddingDTO[]>('/posts/available-biddings')

export const fetchWorkerBiddings = () =>
  api.get<WorkerBiddingDTO[]>('/posts/worker-biddings')

export interface UpdateSubcontractInput {
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
  latitude?: number | null
  longitude?: number | null
  positions?: { categoryId: string; quantity: number; roleDescription: string }[]
}

export const updateSubcontract = (id: string, data: UpdateSubcontractInput) =>
  api.patch<SubcontractDetailDTO[]>(`/posts/subcontracts/group/${id}`, data)

// --- User posts & post lifecycle ---

export interface UserPost {
  id: string
  title: string
  description: string
  status: PostStatus
  createdAt: string
  address: string
  startDate: string
  endDate: string
  categories: { id: string; name: string }[]
  worker: { id: string; name: string } | null
  applicantCount: number
  hasReview: boolean
  isEmergency: boolean
  emergencyExpiresAt: string | null
  isBidding: boolean
}

export const getUserPosts = (): Promise<UserPost[]> =>
  api.post<UserPost[]>('/posts/user-posts').then((r) => r.data)

export const pausePost = (id: string) => api.patch(`/posts/${id}/pause`)

export const cancelPost = (id: string) => api.patch(`/posts/${id}/cancel`)

export const closeBidding = (id: string) => api.post(`/posts/biddings/${id}/close`)

export const completePost = (id: string) => api.patch(`/posts/${id}/complete`)

export const reopenPost = (id: string) => api.patch(`/posts/${id}/reopen`)

export const finalizePost = (id: string) => api.patch(`/posts/${id}/finalize`)

export const markPostInProgress = (id: string) => api.patch(`/posts/${id}/mark-in-progress`)

export const workerCompletePost = (id: string) => api.patch(`/posts/${id}/worker-complete`)

export interface UpdatePostData {
  title: string
  categoryId: string
  description: string
  startDate: string
  endDate: string
  address: string
}

export const updatePost = (id: string, data: UpdatePostData) =>
  api.patch(`/posts/${id}`, data)

export const createEmergencyPost = (data: {
  title: string
  description: string
  categoryId: string
  address: string
  latitude?: number | null
  longitude?: number | null
}) => api.post('/posts/emergency/create', data)
