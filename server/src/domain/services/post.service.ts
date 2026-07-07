import { logger } from '../../lib/logger.js'
import {
  createPost as createPostData,
  createSubPost,
  findPostById,
  findPostsByUser,
  updatePostStatus,
  updatePost as updatePostData,
  findAvailablePosts,
  findAvailableSubcontracts as findAvailableSubcontractsData,
  findEmergencyPosts as findEmergencyPostsData,
  searchByDistance,
  deletePostImages,
  findMySubcontracts,
  findPostsByGroupId,
  findPostCategories,
  type PaginationParams,
} from '../../infrastructure/database/post.database.js'
import { findAcceptedApplication, findAcceptedApplications, findAcceptedApplicationByWorker, updateApplicationStatus, rejectPendingApplications } from '../../infrastructure/database/application.database.js'
import { deleteImage } from '../../infrastructure/providers/cloudinary.provider.js'
import { createTelegramProvider } from '../../infrastructure/providers/telegram.provider.js'
import { notifyUser, broadcastEmergency } from './notification.service.js'
import type { NotificationProvider } from '../types/notification.types.js'
import { ApplicationStatus } from '../types/applicationStatus.js'
import { PostStatus } from '../types/postStatus.js'
import { getWorkerRating, getClientRating, getUserRating } from './user.service.js'
import { EMERGENCY_DURATION_MS } from '../constants.js'
import { PostType } from '../types/postType.js'
import type { CreatePostInput, CreateSubcontractCommand, UpdatePostInput, DomainPost, DomainUserPost } from '../types/post.types.js'
import crypto from 'node:crypto'

const verifySubcontractParent = async (parentPostId: string, userId: string): Promise<DomainPost> => {
  const parent = await findPostById(parentPostId)
  if (!parent) throw Object.assign(new Error('Parent post not found'), { status: 404 })

  const accepted = await findAcceptedApplication(parentPostId)
  if (!accepted || accepted.workerId !== userId) {
    throw Object.assign(new Error('You are not the accepted worker on this post'), { status: 403 })
  }

  return parent
}

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

export const createEmergencyPost = async (input: {
  userId: string
  title: string
  description: string
  categoryId: string
  address: string
  latitude?: number | null
  longitude?: number | null
}): Promise<DomainPost> => {
  logger.info({ userId: input.userId, action: 'post.emergencyCreated' }, 'Emergency post created')
  return createPost({
    ...input,
    isEmergency: true,
    allowsSubcontracting: false,
  })
}

export const createPost = async (input: CreatePostInput): Promise<DomainPost> => {
  validatePostInput(input)
  const now = new Date()
  const emergencyExpiresAt = input.isEmergency === true
    ? new Date(now.getTime() + EMERGENCY_DURATION_MS)
    : null
  const post = await createPostData({
    ...input,
    startDate: input.isEmergency === true ? now : new Date(input.startDate as Date | string),
    endDate: input.isEmergency === true ? new Date(now.getTime() + EMERGENCY_DURATION_MS) : new Date(input.endDate as Date | string),
    emergencyExpiresAt,
  })

  if (input.isEmergency) {
    try {
      await broadcastEmergency(getProvider(), post.id, input.title, input.description, input.categoryId)
    } catch (err) {
      logger.error({ err, postId: post.id, action: 'post.emergencyBroadcast' }, 'Emergency broadcast failed')
    }
  }

  logger.info({ postId: post.id, userId: input.userId, isEmergency: !!input.isEmergency, action: 'post.created' }, 'Post created')

  return post
}

export const createSubContract = async (input: CreateSubcontractCommand): Promise<DomainPost[]> => {
  const parentPost = input.parentPostId
    ? await verifySubcontractParent(input.parentPostId, input.userId)
    : null

  const startDate = input.startDate ?? parentPost?.startDate ?? new Date()
  const endDate   = input.endDate   ?? parentPost?.endDate   ?? new Date()
  const address   = input.address?.trim() || parentPost?.address || 'Por definir'
  const baseTitle = input.title?.trim() || (parentPost ? `Subcontratación: ${parentPost.title}` : 'Subcontratación')

  const groupId = crypto.randomUUID()

  const results = await Promise.all(
    input.positions.map((pos) =>
      createSubPost({
        userId: input.userId,
        parentPostId: input.parentPostId,
        subcontractGroupId: groupId,
        title: pos.roleDescription
          ? `${baseTitle} - ${pos.roleDescription}`
          : baseTitle,
        description: input.description?.trim() || pos.roleDescription || '',
        startDate,
        endDate,
        address,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        positions: [pos],
      })
    )
  )

  logger.info({ userId: input.userId, parentPostId: input.parentPostId, groupId, positions: input.positions.length, action: 'post.subcontractCreated' }, 'Subcontract created')

  return results
}

const enrichWithClientRating = async (post: DomainPost): Promise<DomainPost> => {
  const rating = await getUserRating(post.userId)
  return { ...post, clientRating: rating.averageRating }
}

export interface PaginatedResult {
  data: DomainPost[]
  total: number
  page: number
  totalPages: number
}

export const findAvailableSubcontracts = async (): Promise<DomainPost[]> => {
  const posts = await findAvailableSubcontractsData()
  return Promise.all(posts.map(enrichWithClientRating))
}

export const listAvailablePosts = async (
  category?: string,
  pagination?: PaginationParams,
): Promise<PaginatedResult> => {
  const { posts, total } = await findAvailablePosts(category, pagination)
  const data = await Promise.all(posts.map(enrichWithClientRating))
  const page = pagination?.page ?? 1
  const limit = pagination?.limit ?? total
  return { data, total, page, totalPages: Math.ceil(total / limit) }
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

export const getSubcontractById = async (id: string): Promise<DomainPost | null> => {
  const post = await findPostById(id)
  if (!post || post.type !== PostType.SubContract) return null

  const workerRatingResult = await getWorkerRating(post.userId)
  const workerRating = workerRatingResult.averageRating

  let clientRating: number | undefined
  let parentUser: { name: string; surname: string } | undefined
  if (post.parentPostId) {
    const parent = await findPostById(post.parentPostId)
    if (parent) {
      const clientRatingResult = await getClientRating(parent.userId)
      clientRating = clientRatingResult.averageRating
      parentUser = { name: parent.user.name, surname: parent.user.surname }
    }
  }

  return {
    ...post,
    clientRating,
    workerRating,
    parentUser,
  }
}

export interface MySubcontractStats {
  active: number
  inProgress: number
  paused: number
  completed: number
  averageRating: number
  reviewCount: number
}

export const getMySubcontractManager = async (userId: string): Promise<{
  stats: MySubcontractStats
  subcontracts: DomainPost[]
}> => {
  const [all, rating] = await Promise.all([
    findMySubcontracts(userId),
    getClientRating(userId),
  ])

  const grouped = new Map<string, DomainPost[]>()
  for (const post of all) {
    const key = post.subcontractGroupId ?? post.parentPostId ?? post.id
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(post)
  }

  const subcontracts: DomainPost[] = Array.from(grouped.values()).map((posts) => {
    const first = { ...posts[0] }
    first.categories = posts.flatMap((p) => p.categories)
    const statusOrder = [PostStatus.Active, PostStatus.Paused, PostStatus.InProgress, PostStatus.Completed, PostStatus.Cancelled]
    first.status = statusOrder.find((s) => posts.some((p) => p.status === s)) ?? PostStatus.Active
    return first
  })

  const stats: MySubcontractStats = {
    active: subcontracts.filter((s) => s.status === PostStatus.Active).length,
    inProgress: subcontracts.filter((s) => s.status === PostStatus.InProgress).length,
    paused: subcontracts.filter((s) => s.status === PostStatus.Paused).length,
    completed: subcontracts.filter((s) => s.status === PostStatus.Completed).length,
    averageRating: rating.averageRating,
    reviewCount: rating.reviewCount,
  }

  return { stats, subcontracts }
}

export const getSubcontractGroupDetail = async (firstPostId: string): Promise<DomainPost | null> => {
  const post = await findPostById(firstPostId)
  if (!post || post.type !== PostType.SubContract) return null

  const groupId = post.subcontractGroupId ?? post.parentPostId
  let allPosts: DomainPost[]

  if (groupId) {
    allPosts = await findPostsByGroupId(groupId)
  } else {
    allPosts = [post]
  }

  const merged = { ...allPosts[0] }
  merged.categories = allPosts.flatMap((p) => p.categories)
  merged.postIds = allPosts.map((p) => p.id)

  const workerRatingResult = await getWorkerRating(merged.userId)
  merged.workerRating = workerRatingResult.averageRating

  if (merged.parentPostId) {
    const parent = await findPostById(merged.parentPostId)
    if (parent) {
      const clientRatingResult = await getClientRating(parent.userId)
      merged.clientRating = clientRatingResult.averageRating
      merged.parentUser = { name: parent.user.name, surname: parent.user.surname }
    }
  } else {
    const rating = await getUserRating(merged.userId)
    merged.clientRating = rating.averageRating
  }

  return merged
}

export const getUserPosts = (userId: string): Promise<DomainUserPost[]> =>
  findPostsByUser(userId)

export const pausePost = async (postId: string, userId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 })

  if (post.type === PostType.SubContract && post.subcontractGroupId) {
    const groupPosts = await findPostsByGroupId(post.subcontractGroupId)
    const newStatus = post.status === PostStatus.Active ? PostStatus.Paused : PostStatus.Active
    for (const p of groupPosts) {
      if (p.status !== PostStatus.Active && p.status !== PostStatus.Paused) continue
      await updatePostStatus(p.id, newStatus)
    }
    logger.info({ postId, userId, newStatus, action: 'post.toggledPause' }, `Post ${newStatus === PostStatus.Paused ? 'paused' : 'unpaused'}`)
    return { id: post.id, status: newStatus }
  }

  if (post.status !== PostStatus.Active && post.status !== PostStatus.Paused) {
    throw Object.assign(new Error(`Post cannot be paused in its current state (${post.status})`), { status: 400 })
  }
  const _newStatus = post.status === PostStatus.Active ? PostStatus.Paused : PostStatus.Active
  logger.info({ postId, userId, newStatus: _newStatus, action: 'post.toggledPause' }, `Post ${_newStatus === PostStatus.Paused ? 'paused' : 'unpaused'}`)
  return updatePostStatus(postId, _newStatus)
}

export const cancelPost = async (postId: string, userId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 })

  if (post.type === PostType.SubContract && post.subcontractGroupId) {
    const groupPosts = await findPostsByGroupId(post.subcontractGroupId)
    for (const p of groupPosts) {
      if (p.status === PostStatus.Completed || p.status === PostStatus.Cancelled) continue
      await deletePostImages(p.id).catch(() => {})
      await rejectPendingApplications(p.id)
      await updatePostStatus(p.id, PostStatus.Cancelled)
      const accepted = await findAcceptedApplications(p.id)
      for (const app of accepted) {
        notifyWorker(app.workerId, 'post_cancelled', p.title)
      }
    }
    return { id: post.id, status: PostStatus.Cancelled }
  }

  if (post.status === PostStatus.Completed || post.status === PostStatus.Cancelled) {
    throw Object.assign(new Error(`Post cannot be cancelled in its current state (${post.status})`), { status: 400 })
  }
  await Promise.all(post.images.map((img) => deleteImage(img.url).catch(() => {})))
  await deletePostImages(postId)

  await rejectPendingApplications(postId)

  const result = await updatePostStatus(postId, PostStatus.Cancelled)

  logger.info({ postId, userId, action: 'post.cancelled' }, 'Post cancelled')

  const accepted = await findAcceptedApplications(postId)
  for (const app of accepted) {
    notifyWorker(app.workerId, 'post_cancelled', post.title)
  }

  return result
}

const notifyWorker = (workerId: string, event: string, postTitle: string) => {
  notifyUser(getProvider(), workerId, event as never, { postTitle })
}

export const finalizePost = async (postId: string, userId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 })

  if (post.type === PostType.SubContract && post.subcontractGroupId) {
    const groupPosts = await findPostsByGroupId(post.subcontractGroupId)
    for (const p of groupPosts) {
      if (p.status === PostStatus.Completed || p.status === PostStatus.Cancelled) continue
      const accepted = await findAcceptedApplications(p.id)
      for (const app of accepted) {
        await updateApplicationStatus(app.id, ApplicationStatus.Completed)
        notifyWorker(app.workerId, 'post_completed', p.title)
      }
      await rejectPendingApplications(p.id)
      await updatePostStatus(p.id, PostStatus.Completed)
    }
    return { id: post.id, status: PostStatus.Completed }
  }

  if (post.status !== PostStatus.Paused && post.status !== PostStatus.Active) {
    throw Object.assign(new Error('Post must be paused or active to be finalized'), { status: 400 })
  }
  const accepted = await findAcceptedApplications(postId)
  for (const app of accepted) {
    await updateApplicationStatus(app.id, ApplicationStatus.Completed)
    notifyWorker(app.workerId, 'post_completed', post.title)
  }
  await rejectPendingApplications(postId)
  const result = await updatePostStatus(postId, PostStatus.Completed)

  logger.info({ postId, userId, action: 'post.finalized' }, 'Post finalized')

  return result
}

export const completePost = async (postId: string, userId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 })

  if (post.type === PostType.SubContract && post.subcontractGroupId) {
    const groupPosts = await findPostsByGroupId(post.subcontractGroupId)
    for (const p of groupPosts) {
      if (p.status === PostStatus.Completed || p.status === PostStatus.Cancelled) continue
      const accepted = await findAcceptedApplications(p.id)
      for (const app of accepted) {
        await updateApplicationStatus(app.id, ApplicationStatus.Completed)
        notifyWorker(app.workerId, 'post_completed', p.title)
      }
      await rejectPendingApplications(p.id)
      await updatePostStatus(p.id, PostStatus.Completed)
    }
    return { id: post.id, status: PostStatus.Completed }
  }

  if (post.status !== PostStatus.InProgress && post.status !== PostStatus.Active) {
    throw Object.assign(new Error('Post must be in progress or active to be completed'), { status: 400 })
  }
  const accepted = await findAcceptedApplications(postId)
  for (const app of accepted) {
    await updateApplicationStatus(app.id, ApplicationStatus.Completed)
    notifyWorker(app.workerId, 'post_completed', post.title)
  }
  await rejectPendingApplications(postId)
  const result = await updatePostStatus(postId, PostStatus.Completed)

  logger.info({ postId, userId, action: 'post.completed' }, 'Post completed')

  return result
}

const notifyClient = (clientId: string, event: string, postTitle: string) => {
  notifyUser(getProvider(), clientId, event as never, { postTitle })
}

export const workerCompletePost = async (postId: string, workerId: string) => {
  const app = await findAcceptedApplicationByWorker(postId, workerId)
  if (!app) throw Object.assign(new Error('No tenés una postulación aceptada en esta publicación'), { status: 404 })

  if (!app.tokenValidatedAt) {
    throw Object.assign(new Error('Debe validar el código de inicio antes de finalizar el trabajo'), { status: 400 })
  }

  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })

  await updateApplicationStatus(app.id, ApplicationStatus.Completed)
  await rejectPendingApplications(postId)
  const result = await updatePostStatus(postId, PostStatus.Completed)

  notifyClient(post.userId, 'post_completed', post.title)

  logger.info({ postId, workerId, action: 'post.workerCompleted' }, 'Worker completed post')

  return result
}

export const reopenPost = async (postId: string, userId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 })

  if (post.type === PostType.SubContract && post.subcontractGroupId) {
    const groupPosts = await findPostsByGroupId(post.subcontractGroupId)
    for (const p of groupPosts) {
      if (p.status !== PostStatus.InProgress) continue
      const accepted = await findAcceptedApplications(p.id)
      for (const app of accepted) {
        await updateApplicationStatus(app.id, ApplicationStatus.Pending)
      }
      await updatePostStatus(p.id, PostStatus.Active)
    }
    logger.info({ postId, userId, action: 'post.reopened' }, 'Post reopened')
    return { id: post.id, status: PostStatus.Active }
  }

  if (post.status !== PostStatus.InProgress) {
    throw Object.assign(new Error('Post must be in progress to be reopened'), { status: 400 })
  }
  const accepted = await findAcceptedApplications(postId)
  for (const app of accepted) {
    await updateApplicationStatus(app.id, ApplicationStatus.Pending)
  }
  logger.info({ postId, userId, action: 'post.reopened' }, 'Post reopened')
  return updatePostStatus(postId, PostStatus.Active)
}

export const markInProgress = async (postId: string, userId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.userId !== userId) throw Object.assign(new Error('Forbidden'), { status: 403 })
  if (post.status !== PostStatus.Active) {
    throw Object.assign(new Error(`Post must be active to mark in progress (${post.status})`), { status: 400 })
  }

  if (post.type === PostType.SubContract && post.subcontractGroupId) {
    const groupPosts = await findPostsByGroupId(post.subcontractGroupId)
    const allCategories = groupPosts.flatMap((p) => p.categories)
    const hasHired = allCategories.some((c) => c.filledCount && c.filledCount > 0)
    if (!hasHired) {
      throw Object.assign(new Error('Must have at least one hired worker'), { status: 400 })
    }
    for (const p of groupPosts) {
      if (p.status !== PostStatus.Active) continue
      await updatePostStatus(p.id, PostStatus.InProgress)
    }
    logger.info({ postId, userId, action: 'post.markedInProgress' }, 'Post marked in progress')
    return { id: post.id, status: PostStatus.InProgress }
  }

  const categories = await findPostCategories(postId)
  const hasHired = categories.some((c) => c.filledCount > 0)
  if (!hasHired) {
    throw Object.assign(new Error('Must have at least one hired worker'), { status: 400 })
  }

  logger.info({ postId, userId, action: 'post.markedInProgress' }, 'Post marked in progress')
  return updatePostStatus(postId, PostStatus.InProgress)
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

  logger.info({ postId, userId, action: 'post.updated' }, 'Post updated')
  return updatePostData(postId, {
    ...input,
    userId,
    startDate: input.isEmergency === true ? now : new Date(input.startDate as Date | string),
    endDate: input.isEmergency === true ? new Date(now.getTime() + EMERGENCY_DURATION_MS) : new Date(input.endDate as Date | string),
    emergencyExpiresAt,
  })
}
