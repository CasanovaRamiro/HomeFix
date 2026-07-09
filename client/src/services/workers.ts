import api from './api'

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
  matriculaUrl: string | null
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
  matriculaUrl?: string | null
  categoryIds?: string[]
  availability?: string[]
  certificates?: { id: string; title: string; issuer?: string | null; imageUrl: string }[]
  gallery?: { id: string; imageUrl: string; caption?: string | null }[]
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

export interface WorkerStats {
  cancelledJobs: number
  reports: number
  totalJobs: number
  avgRating: number
  reviewCount: number
}

export const getWorkers = (): Promise<Worker[]> =>
  api.get<Worker[]>('/workers').then((r) => r.data)

export const getWorker = (id: string): Promise<Worker> =>
  api.get<Worker>(`/workers/${id}`).then((r) => r.data)

export const getWorkerReviews = (id: string): Promise<WorkerReview[]> =>
  api.get<WorkerReview[]>(`/workers/${id}/reviews`).then((r) => r.data)

export const getWorkerStats = (id: string): Promise<WorkerStats> =>
  api.get<WorkerStats>(`/workers/${id}/stats`).then((r) => r.data)

export const updateWorkerProfile = (id: string, data: WorkerUpdateData): Promise<Worker> =>
  api.patch<Worker>(`/workers/${id}`, data).then((r) => r.data)
