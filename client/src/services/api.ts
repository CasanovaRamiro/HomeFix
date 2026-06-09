import axios from 'axios'
import { env } from '../lib/envConfig'
import type { ReviewInput } from '../types/review'
import type { PostStatus } from '../types/post'

const api = axios.create({ baseURL: env.VITE_API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getWorkers = (): Promise<Worker[]> =>
  api.get<Worker[]>('/workers').then((r) => r.data)

export const getWorker = (id: string): Promise<Worker> =>
  api.get<Worker>(`/workers/${id}`).then((r) => r.data)

export const getWorkerReviews = (id: string): Promise<WorkerReview[]> =>
  api.get<WorkerReview[]>(`/workers/${id}/reviews`).then((r) => r.data)

export interface WorkerCategory {
  category: { id: string; name: string }
}

export interface Worker {
  id: string
  name: string
  email: string
  phone: string | null
  bio: string | null
  role: string
  createdAt: string
  categories: WorkerCategory[]
}

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
}

export const createReview = (data: ReviewInput) =>
  api.post('/reviews', data)

export const getUserPosts = (): Promise<UserPost[]> =>
  api.post<UserPost[]>('/posts/user-posts').then((r) => r.data)

export const pausePost = (id: string) => api.patch(`/posts/${id}/pause`)

export const cancelPost = (id: string) => api.patch(`/posts/${id}/cancel`)

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

export default api
