import { env } from '../lib/envConfig'
import type { ReviewInput } from '../types/review'
import type { PostStatus } from '../types/post'
import axios from 'axios'

const api = axios.create({ baseURL: env.VITE_API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const uploadImages = async (files: File[]): Promise<string[]> => {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const { data } = await api.post('/upload', form)
  return data.urls as string[]
}

export const getWorkers = (): Promise<Worker[]> =>
  api.get<Worker[]>('/workers').then((r) => r.data)

export const getWorker = (id: string): Promise<Worker> =>
  api.get<Worker>(`/workers/${id}`).then((r) => r.data)

export const getWorkerReviews = (id: string): Promise<WorkerReview[]> =>
  api.get<WorkerReview[]>(`/workers/${id}/reviews`).then((r) => r.data)

export interface WorkerCategory {
  id: string
  name: string
}

export interface Worker {
  id: string
  name: string
  email: string
  phone: string | null
  bio: string | null
  role: string
  photo: string | null
  availability: string[]
  createdAt: string
  categories: { id: string; name: string }[]
  emergenciesEnabled: boolean
  certificates: { id: string; title: string; issuer: string | null; imageUrl: string }[]
  gallery: { id: string; imageUrl: string; caption: string | null }[]
}

export interface WorkerUpdateData {
  name?: string
  phone?: string | null
  bio?: string | null
  photo?: string | null
  categoryIds?: string[]
  availability?: string[]
  certificates?: { id: string; title: string; issuer?: string | null; imageUrl: string }[]
  gallery?: { id: string; imageUrl: string; caption?: string | null }[]
}

export const updateWorkerProfile = (id: string, data: WorkerUpdateData): Promise<Worker> =>
  api.patch<Worker>(`/workers/${id}`, data).then((r) => r.data)

export interface WorkerReview {
  id: string
  rating: number
  description: string
  mediaUrls: string | null
  createdAt: string
  reviewer: { id: string; name: string }
  application: {
    postId: string
    post: { id: string; title: string }
  }
}

export interface ClientProfile {
  id: string
  name: string
  surname: string
  bio: string | null
  role: string
  photo: string | null
  createdAt: string
  averageRating: number
  reviewCount: number
  completedJobs: number
  // Only present when the requester is the owner.
  email?: string
  phone?: string | null
  address?: { street: string; number: string; city: string; state: string } | null
  requiresStartToken?: boolean
}

export interface ClientProfileUpdateData {
  name?: string
  surname?: string
  phone?: string | null
  bio?: string | null
  photo?: string | null
}

export interface ClientReview {
  id: string
  rating: number
  description: string | null
  createdAt: string
  reviewer: { id: string; name: string }
  client: { id: string; name: string }
}

export const getClientProfile = (id: string): Promise<ClientProfile> =>
  api.get<ClientProfile>(`/client-profiles/${id}`).then((r) => r.data)

export const updateClientProfile = (id: string, data: ClientProfileUpdateData): Promise<ClientProfile> =>
  api.patch<ClientProfile>(`/client-profiles/${id}`, data).then((r) => r.data)

export const getClientReviews = (id: string): Promise<ClientReview[]> =>
  api.get<ClientReview[]>(`/users/${id}/reviews`, { params: { as: 'client' } }).then((r) => r.data)

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

export const createReview = (data: ReviewInput) =>
  api.post('/reviews', data)

export const getUserPosts = (): Promise<UserPost[]> =>
  api.post<UserPost[]>('/posts/user-posts').then((r) => r.data)

export const pausePost = (id: string) => api.patch(`/posts/${id}/pause`)

export const cancelPost = (id: string) => api.patch(`/posts/${id}/cancel`)

export const completePost = (id: string) => api.patch(`/posts/${id}/complete`)

export const reopenPost = (id: string) => api.patch(`/posts/${id}/reopen`)

export const finalizePost = (id: string) => api.patch(`/posts/${id}/finalize`)

export const markPostInProgress = (id: string) => api.patch(`/posts/${id}/mark-in-progress`)

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

export const updateUserEmergencyNotifications = (id: string, enabled: boolean) =>
  api.patch(`/users/${id}/emergencies`, { enabled })

export const updateUserRequiresStartToken = (id: string, enabled: boolean) =>
  api.patch(`/users/${id}/start-token-setting`, { enabled })

export const telegramLink = (): Promise<{ code: string; deepLink: string; message: string }> =>
  api.post('/telegram/link').then((r) => r.data)

export const telegramStatus = (): Promise<{ linked: boolean; linkedAt: string | null }> =>
  api.get('/telegram/status').then((r) => r.data)

export const telegramUnlink = () =>
  api.delete('/telegram/unlink')

export default api
