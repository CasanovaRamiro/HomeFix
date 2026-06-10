import {
  createPost as createPostData,
  findPostById,
  findPostsByUser,
  updatePostStatus,
  updatePost as updatePostData,
  findAvailablePosts,
  findEmergencyPosts as findEmergencyPostsData,
  searchByDistance,
  deletePostImages,
} from '../../infrastructure/database/post.database.js'
import { findAcceptedApplication, updateApplicationStatus } from '../../infrastructure/database/application.database.js'
import { deleteImage } from '../../infrastructure/providers/cloudinary.provider.js'
import { createTelegramProvider } from '../../infrastructure/providers/telegram.provider.js'
import { notifyUser } from './notification.service.js'
import type { NotificationProvider } from '../types/notification.types.js'
import { ApplicationStatus } from '../types/applicationStatus.js'
import { PostStatus } from '../types/postStatus.js'
import { getUserRating } from './user.service.js'
import { EMERGENCY_DURATION_MS } from '../constants.js'
import type { CreatePostInput, UpdatePostInput, DomainPost, DomainUserPost } from '../types/post.types.js'

let _provider: NotificationProvider
const getProvider = () => {
  if (!_provider) _provider = createTelegramProvider()
  return _provider
}

export const validatePostInput = (input: CreatePostInput) => {
  if (!input.categoryId) {
    throw new Error('At least one category must be selected')
  }
  if (!input.title || input.title.trim() === '') {
    throw new Error('title is required')
  }
  if (!input.description || input.description.trim() === '') {
    throw new Error('description is required')
  }
  if (!input.address || input.address.trim() === '') {
    throw new Error('address is required')
  }
  if (input.isEmergency === true) {
    return
  }
  if (!input.startDate || !input.endDate) {
    throw new Error('startDate and endDate are required')
  }
  if (new Date(input.endDate) <= new Date(input.startDate)) {
    throw new Error('endDate must be after startDate')
  }
}

export const createPost = async (input: CreatePostInput): Promise<DomainPost> => {
  validatePostInput(input)
  const now = new Date()
  const emergencyExpiresAt = input.isEmergency === true
    ? new Date(now.getTime() + EMERGENCY_DURATION_MS)
    : null
  return createPostData({
    ...input,
    startDate: input.isEmergency === true ? now : new Date(input.startDate as Date | string),
    endDate: input.isEmergency === true ? new Date(now.getTime() + EMERGENCY_DURATION_MS) : new Date(input.endDate as Date | string),
    emergencyExpiresAt,
  })
}

const enrichWithClientRating = async (post: DomainPost): Promise<DomainPost> => {
  const rating = await getUserRating(post.userId)
  return { ...post, clientRating: rating.averageRating }
}

export const listAvailablePosts = async (category?: string): Promise<DomainPost[]> => {
  const posts = await findAvailablePosts(category)
  return Promise.all(posts.map(enrichWithClientRating))
}

export const listEmergencyPosts = async (category?: string): Promise<DomainPost[]> => {
  const posts = await findEmergencyPostsData(category)
  return Promise.all(posts.map(enrichWithClientRating))
}

export const searchPostsByDistance = async (
  lat: number,
  lng: number,
  radiusKm: number,
  category?: string,
): Promise<DomainPost[]> => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusKm)) {
    throw new Error('lat, lng, and radius must be finite numbers')
  }
  if (radiusKm <= 0 || radiusKm > 1000) {
    throw new Error('radius must be between 1 and 1000 km')
  }
  if (lat < -90 || lat > 90) {
    throw new Error('latitude must be between -90 and 90')
  }
  if (lng < -180 || lng > 180) {
    throw new Error('longitude must be between -180 and 180')
  }
  const posts = await searchByDistance(lat, lng, radiusKm, category)
  return Promise.all(posts.map(enrichWithClientRating))
}

export const getPostById = async (id: string): Promise<DomainPost | null> => {
  const post = await findPostById(id)
  if (!post) return null
  return enrichWithClientRating(post)
}

export const getUserPosts = (userId: string): Promise<DomainUserPost[]> =>
  findPostsByUser(userId)

export const pausePost = async (postId: string, userId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 })
  if (post.status !== 'Active' && post.status !== 'Paused') {
    throw Object.assign(new Error(`Post cannot be paused in its current state (${post.status})`), { status: 400 })
  }
  const newStatus = post.status === 'Active' ? 'Paused' : 'Active'
  return updatePostStatus(postId, newStatus)
}

export const cancelPost = async (postId: string, userId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 })
  if (post.status === 'Completed' || post.status === 'Cancelled') {
    throw Object.assign(new Error(`Post cannot be cancelled in its current state (${post.status})`), { status: 400 })
  }
  await Promise.all(post.images.map((img) => deleteImage(img.url).catch(() => {})))
  await deletePostImages(postId)

  const result = await updatePostStatus(postId, 'Cancelled')

  const accepted = await findAcceptedApplication(postId)
  if (accepted) {
    notifyUser(getProvider(), accepted.workerId, 'post_cancelled', {
      postTitle: post.title,
    })
  }

  return result
}

const notifyOtherOnComplete = (postTitle: string, accepted: { workerId: string } | null) => {
  if (!accepted) return
  notifyUser(getProvider(), accepted.workerId, 'post_completed', { postTitle })
}

export const finalizePost = async (postId: string, userId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 })
  if (post.status !== 'Paused') {
    throw Object.assign(new Error('Post must be paused to be finalized'), { status: 400 })
  }
  const accepted = await findAcceptedApplication(postId)
  if (accepted) {
    await updateApplicationStatus(accepted.id, 'Completed')
  }
  const result = await updatePostStatus(postId, 'Completed')
  notifyOtherOnComplete(post.title, accepted)
  return result
}

export const completePost = async (postId: string, userId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 })
  if (post.status !== PostStatus.InProgress) {
    throw Object.assign(new Error('Post must be in progress to be completed'), { status: 400 })
  }
  const accepted = await findAcceptedApplication(postId)
  if (accepted) {
    await updateApplicationStatus(accepted.id, ApplicationStatus.Completed)
  }
  const result = await updatePostStatus(postId, ApplicationStatus.Completed)
  notifyOtherOnComplete(post.title, accepted)
  return result
}

export const reopenPost = async (postId: string, userId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 })
  if (post.status !== 'In progress') {
    throw Object.assign(new Error('Post must be in progress to be reopened'), { status: 400 })
  }
  const accepted = await findAcceptedApplication(postId)
  if (accepted) {
    await updateApplicationStatus(accepted.id, 'Pending')
  }
  return updatePostStatus(postId, 'Active')
}

export const updatePost = async (postId: string, userId: string, input: Omit<UpdatePostInput, 'userId'>) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 })

  const nonEditable = [PostStatus.InProgress, PostStatus.Completed, PostStatus.Cancelled]
  if (nonEditable.includes(post.status as PostStatus)) {
    throw Object.assign(new Error(`Post cannot be edited in its current state (${post.status})`), { status: 400 })
  }

  validatePostInput({ ...input, userId })
  const now = new Date()
  const emergencyExpiresAt = input.isEmergency === true
    ? new Date(now.getTime() + EMERGENCY_DURATION_MS)
    : null

  return updatePostData(postId, {
    ...input,
    userId,
    startDate: input.isEmergency === true ? now : new Date(input.startDate as Date | string),
    endDate: input.isEmergency === true ? new Date(now.getTime() + EMERGENCY_DURATION_MS) : new Date(input.endDate as Date | string),
    emergencyExpiresAt,
  })
}
