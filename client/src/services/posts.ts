import api from './api'
import type { Post } from '../types/post'

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
