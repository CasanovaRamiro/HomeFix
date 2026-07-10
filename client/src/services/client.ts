import api from './api'
import type { Post } from '../types/post'
import type { UserPost } from './posts'

export interface ClientStats {
  completedPosts: number
  cancelledPosts: number
  unreviewedJobs: number
  clientRating: { averageRating: number; reviewCount: number }
}

export interface ClientPostsPage {
  data: UserPost[]
  total: number
  page: number
  limit: number
}

export const fetchClientStats = () =>
  api.get<ClientStats>('/client/stats')

export const fetchClientPosts = (page: number, limit: number) =>
  api.get<ClientPostsPage>(`/client/posts?page=${page}&limit=${limit}`)

export const fetchClientBiddings = () =>
  api.get<{ stats: { active: number; evaluating: number; completed: number }; biddings: Post[] }>('/client/biddings')
