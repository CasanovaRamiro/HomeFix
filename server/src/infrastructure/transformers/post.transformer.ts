import type { PrismaPostFull } from '../types/post.types.js'
import type { DomainPost } from '../../domain/types/post.types.js'

export const toDomainPost = (post: PrismaPostFull): DomainPost => ({
  id: post.id,
  userId: post.userId,
  type: post.type,
  parentPostId: post.parentPostId,
  title: post.title,
  description: post.description,
  startDate: post.startDate,
  endDate: post.endDate,
  address: post.address,
  status: post.status,
  createdAt: post.createdAt,
  images: post.images,
  latitude: post.latitude,
  longitude: post.longitude,
  isEmergency: post.isEmergency,
  emergencyExpiresAt: post.emergencyExpiresAt,
  categories: post.categories.map((pc) => ({
    id: pc.category.id,
    name: pc.category.name,
    quantity: pc.quantity,
    filledCount: pc.filledCount,
    roleDescription: pc.roleDescription,
  })),
  user: post.user,
})
