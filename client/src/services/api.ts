import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:3000' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getWorkers = (): Promise<Worker[]> =>
  api.get<Worker[]>('/workers').then((r) => r.data)

export const getWorker = (id: number): Promise<Worker> =>
  api.get<Worker>(`/workers/${id}`).then((r) => r.data)

export const getWorkerReviews = (id: number): Promise<WorkerReview[]> =>
  api.get<WorkerReview[]>(`/workers/${id}/reviews`).then((r) => r.data)

export interface WorkerCategory {
  category: { id: number; name: string }
}

export interface Worker {
  id: number
  name: string
  email: string
  phone: string | null
  bio: string | null
  role: string
  createdAt: string
  categories: WorkerCategory[]
}

export interface WorkerReview {
  id: number
  rating: number
  description: string
  mediaUrls: string | null
  createdAt: string
  reviewer: { id: number; name: string }
  jobApplication: {
    postId: number
    post: { id: number; title: string }
  }
}

export default api
