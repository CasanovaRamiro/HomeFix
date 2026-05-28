import api from './api'
import type { Post } from '../types/post'

export const fetchAvailablePosts = (category?: string) =>
  api.get<Post[]>('/posts/available', {
    params: category?.trim() ? { category: category.trim() } : undefined,
  })

export const searchPostsByLocation = (lat: number, lng: number, radius: number, category?: string) =>
  api.get<Post[]>('/posts/search-location', {
    params: { lat, lng, radius, ...(category?.trim() ? { category: category.trim() } : {}) },
  })

export const fetchPostById = (id: number) =>
  api.get<Post>(`/posts/${id}`)
