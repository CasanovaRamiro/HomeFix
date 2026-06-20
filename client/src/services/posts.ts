import api from './api'
import type { Post, CreateSubcontractInput, SubcontractDTO, AvailableSubcontractDTO, SubcontractDetailDTO } from '../types/post'

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
