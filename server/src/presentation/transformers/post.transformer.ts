import type { DomainPost, DomainUserPost } from '../../domain/types/post.types.js'
import type { PostDTO, UserPostDTO } from '../types/post.types.js'

export const toPostDTO = (post: DomainPost): PostDTO => ({
  id: post.id,
  userId: post.userId,
  title: post.title,
  description: post.description,
  startDate: post.startDate.toISOString(),
  endDate: post.endDate.toISOString(),
  address: post.address,
  status: post.status,
  createdAt: post.createdAt.toISOString(),
  images: post.images,
  latitude: post.latitude,
  longitude: post.longitude,
  isEmergency: post.isEmergency ?? false,
  emergencyExpiresAt: post.emergencyExpiresAt?.toISOString() ?? null,
  categories: post.categories,
  user: post.user,
  clientRating: post.clientRating ?? 0,
})

export const toUserPostDTO = (post: DomainUserPost): UserPostDTO => ({
  id: post.id,
  title: post.title,
  description: post.description,
  status: post.status,
  createdAt: post.createdAt.toISOString(),
  address: post.address,
  startDate: post.startDate.toISOString(),
  endDate: post.endDate.toISOString(),
  categories: post.categories,
  worker: post.worker,
  applicantCount: post.applicantCount,
  hasReview: post.hasReview,
  isEmergency: post.isEmergency ?? false,
  emergencyExpiresAt: post.emergencyExpiresAt?.toISOString() ?? null,
})
