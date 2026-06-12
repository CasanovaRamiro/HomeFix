import api from './api'
import type { Post, CreateSubcontractInput, SubcontractDTO, AvailableSubcontractDTO } from '../types/post'

export const fetchAvailablePosts = (category?: string) =>
  api.get<Post[]>('/posts/available', {
    params: category?.trim() ? { category: category.trim() } : undefined,
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
