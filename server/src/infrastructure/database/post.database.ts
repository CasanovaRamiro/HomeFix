import prisma from '../../lib/prisma.js'
import type { CreatePostInput, CreateBiddingInput, UpdatePostInput, DomainPost, DomainUserPost } from '../../domain/types/post.types.js'
import { PostType } from '../../domain/types/postType.js'
import type { PrismaPostFull } from '../types/post.types.js'
import { toDomainPost } from '../transformers/post.transformer.js'
import { PostStatus } from '../../domain/types/postStatus.js'
import { ApplicationStatus } from '../../domain/types/applicationStatus.js'
import { EMERGENCY_DURATION_MS } from '../../domain/constants.js'

type _CreatePostRecordInput = {
  userId: string
  type: PostType
  parentPostId: string | null
  subcontractGroupId: string | null
  title: string
  description: string
  startDate: Date
  endDate: Date
  address: string
  latitude?: number | null
  longitude?: number | null
  isEmergency: boolean
  emergencyExpiresAt: Date | null
  allowsSubcontracting?: boolean
  isBidding?: boolean
  bidWeights?: string
  materialResponsibility?: string
  budgetMax?: number | null
  images?: { url: string }[]
  categories: {
    categoryId: string
    quantity?: number
    filledCount?: number
    roleDescription?: string | null
  }[]
}

async function _createPostRecord(data: _CreatePostRecordInput): Promise<DomainPost> {
  const raw = await prisma.post.create({
    data: {
      userId: data.userId,
      type: data.type,
      parentPostId: data.parentPostId,
      subcontractGroupId: data.subcontractGroupId,
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      address: data.address,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      isEmergency: data.isEmergency,
      emergencyExpiresAt: data.emergencyExpiresAt,
      allowsSubcontracting: data.allowsSubcontracting ?? true,
      isBidding: data.isBidding ?? false,
      bidWeights: data.bidWeights ?? null,
      materialResponsibility: data.materialResponsibility ?? null,
      budgetMax: data.budgetMax ?? null,
      images: data.images?.length ? { create: data.images.map(img => ({ url: img.url })) } : undefined,
      categories: { create: data.categories },
    },
    select: postFields,
  }) as unknown as PrismaPostFull
  return toDomainPost(raw)
}

const postFields = {
  id: true,
  userId: true,
  type: true,
  parentPostId: true,
  subcontractGroupId: true,
  title: true,
  description: true,
  startDate: true,
  endDate: true,
  address: true,
  status: true,
  createdAt: true,
  images: {
    select: { url: true },
  },
  latitude: true,
  longitude: true,
  isEmergency: true,
  emergencyExpiresAt: true,
  allowsSubcontracting: true,
  isBidding: true,
  bidWeights: true,
  materialResponsibility: true,
  budgetMax: true,
  categories: {
    select: {
      id: true,
      categoryId: true,
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      quantity: true,
      filledCount: true,
      roleDescription: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      surname: true,
    },
  },
} as const

export const createPost = async (data: CreatePostInput): Promise<DomainPost> => {
  const now = new Date()
  const startDate = data.startDate ? new Date(data.startDate) : now
  const endDate = data.endDate ? new Date(data.endDate) : new Date(now.getTime() + EMERGENCY_DURATION_MS)
  return _createPostRecord({
    userId: data.userId,
    type: data.isEmergency ? PostType.Emergency : PostType.Post,
    parentPostId: null,
    subcontractGroupId: null,
    title: data.title,
    description: data.description,
    startDate,
    endDate,
    address: data.address,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    isEmergency: data.isEmergency ?? false,
    emergencyExpiresAt: data.isEmergency
      ? new Date(Date.now() + EMERGENCY_DURATION_MS)
      : (data.emergencyExpiresAt ?? null),
    allowsSubcontracting: data.allowsSubcontracting ?? true,
    images: data.images,
    categories: [{ categoryId: data.categoryId }],
  })
}

export const createBiddingPost = async (data: CreateBiddingInput): Promise<DomainPost> =>
  _createPostRecord({
    userId: data.userId,
    type: PostType.Post,
    parentPostId: null,
    subcontractGroupId: null,
    title: data.title,
    description: data.description,
    startDate: new Date(),
    endDate: data.endDate,
    address: data.address,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    isEmergency: false,
    emergencyExpiresAt: null,
    allowsSubcontracting: true,
    isBidding: true,
    bidWeights: data.bidWeights,
    materialResponsibility: data.materialResponsibility,
    budgetMax: data.budgetMax ?? null,
    images: data.imageUrls.map(url => ({ url })),
    categories: data.categoryIds.map(cid => ({ categoryId: cid })),
  })

export const createSubPost = async (data: {
  userId: string
  parentPostId?: string
  subcontractGroupId?: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  address: string
  latitude?: number | null
  longitude?: number | null
  positions: { categoryId: string; quantity: number; roleDescription: string }[]
}): Promise<DomainPost> =>
  _createPostRecord({
    userId: data.userId,
    type: PostType.SubContract,
    parentPostId: data.parentPostId ?? null,
    subcontractGroupId: data.subcontractGroupId ?? null,
    title: data.title,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    address: data.address,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    isEmergency: false,
    emergencyExpiresAt: null,
    categories: data.positions.map(p => ({
      categoryId: p.categoryId,
      quantity: p.quantity,
      filledCount: 0,
      roleDescription: p.roleDescription,
    })),
  })

const availablePostWhere = (category?: string) => ({
  status: 'Active',
  type: { in: [PostType.Post, PostType.Emergency] },
  ...(category?.trim()
    ? {
        categories: {
          some: {
            category: {
              name: category.trim(),
            },
          },
        },
      }
    : {}),
})

export interface PaginationParams {
  page: number
  limit: number
  sortOrder: 'asc' | 'desc'
}

const deleteExpiredEmergencyPosts = async (): Promise<void> => {
  await prisma.post.deleteMany({
    where: {
      isEmergency: true,
      emergencyExpiresAt: { lte: new Date() },
    },
  })
}

export interface PaginatedPosts {
  posts: DomainPost[]
  total: number
}

export const findAvailablePosts = async (
  category?: string,
  pagination?: PaginationParams,
): Promise<PaginatedPosts> => {
  await deleteExpiredEmergencyPosts()
  const where = availablePostWhere(category)
  const orderBy = { createdAt: pagination?.sortOrder ?? 'desc' }

  const [raw, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      select: postFields,
      ...(pagination ? { skip: (pagination.page - 1) * pagination.limit, take: pagination.limit } : {}),
    }) as unknown as Promise<PrismaPostFull[]>,
    prisma.post.count({ where }),
  ])

  return { posts: raw.map(toDomainPost), total }
}

export const findAvailableSubcontracts = async (): Promise<DomainPost[]> => {
  const raw = await prisma.post.findMany({
    where: { type: PostType.SubContract, status: 'Active' } as never,
    orderBy: { createdAt: 'desc' },
    select: postFields,
  }) as unknown as PrismaPostFull[]
  return raw.map(toDomainPost)
}

export const findBiddingPostsByUser = async (userId: string): Promise<DomainPost[]> => {
  const raw = await prisma.post.findMany({
    where: { userId, isBidding: true } as never,
    orderBy: { createdAt: 'desc' },
    select: postFields,
  }) as unknown as PrismaPostFull[]
  return raw.map(toDomainPost)
}

export const findMySubcontracts = async (userId: string): Promise<DomainPost[]> => {
  const raw = await prisma.post.findMany({
    where: { userId, type: PostType.SubContract } as never,
    orderBy: { createdAt: 'desc' },
    select: postFields,
  }) as unknown as PrismaPostFull[]
  return raw.map(toDomainPost)
}

export const findPostsByGroupId = async (groupId: string): Promise<DomainPost[]> => {
  const raw = await prisma.post.findMany({
    where: { subcontractGroupId: groupId } as never,
    orderBy: { createdAt: 'asc' },
    select: postFields,
  }) as unknown as PrismaPostFull[]
  return raw.map(toDomainPost)
}

export const findEmergencyPosts = async (category?: string): Promise<DomainPost[]> => {
  await deleteExpiredEmergencyPosts()
  const raw = await prisma.post.findMany({
    where: {
      status: 'Active',
      type: PostType.Emergency,
      emergencyExpiresAt: { gt: new Date() },
      ...(category?.trim()
        ? {
            categories: {
              some: {
                category: {
                  name: category.trim(),
                },
              },
            },
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: postFields,
  }) as unknown as PrismaPostFull[]
  return raw.map(toDomainPost)
}

export const findPostById = async (id: string): Promise<DomainPost | null> => {
  const raw = await prisma.post.findUnique({
    where: { id },
    select: postFields,
  }) as unknown as PrismaPostFull | null
  return raw ? toDomainPost(raw) : null
}

export interface LocationSearchResult extends DomainPost {
  distance: number
}

export const findPostsByUser = async (userId: string): Promise<DomainUserPost[]> => {
  const posts = await prisma.post.findMany({
    where: {
      userId,
      OR: [
        { status: { in: [PostStatus.Active, PostStatus.InProgress, PostStatus.Paused, PostStatus.Completed] } },
        // Cancelled posts that had a hired worker — surfaced so the client can still review them.
        { status: PostStatus.Cancelled, applications: { some: { status: { in: [ApplicationStatus.Accepted, ApplicationStatus.Completed] } } } },
      ],
    },
    include: {
      categories: { include: { category: true } },
      applications: {
        where: { status: { in: [ApplicationStatus.Accepted, ApplicationStatus.Completed] } },
        include: {
          worker: { select: { id: true, name: true } },
          review: { select: { id: true } },
        },
        take: 1,
      },
      _count: { select: { applications: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    description: post.description,
    status: post.status,
    createdAt: post.createdAt,
    address: post.address,
    startDate: post.startDate,
    endDate: post.endDate,
    categories: post.categories.map((pc) => ({
      id: pc.category.id,
      name: pc.category.name,
    })),
    worker: post.applications[0]?.worker ?? null,
    applicantCount: post._count.applications,
    hasReview: post.applications.some((a) => a.review !== null),
    isEmergency: post.isEmergency,
    emergencyExpiresAt: post.emergencyExpiresAt,
    isBidding: post.isBidding,
  }))
}

export const updatePostStatus = (id: string, status: string): Promise<{ id: string; status: string }> =>
  prisma.post.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  })

export const deletePostImages = (postId: string) =>
  prisma.postImage.deleteMany({ where: { postId } })

export const updatePost = async (id: string, data: UpdatePostInput): Promise<DomainPost> => {
  const now = new Date()
  const startDate = data.startDate ? new Date(data.startDate) : now
  const endDate = data.endDate ? new Date(data.endDate) : new Date(now.getTime() + EMERGENCY_DURATION_MS)
  const raw = await prisma.$transaction(async (tx) => {
    await tx.postCategory.deleteMany({ where: { postId: id } })
    await tx.postCategory.create({ data: { postId: id, categoryId: data.categoryId } })
    return tx.post.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        startDate,
        endDate,
        address: data.address,
        isEmergency: data.isEmergency ?? undefined,
    emergencyExpiresAt: data.isEmergency
      ? new Date(Date.now() + EMERGENCY_DURATION_MS)
      : (data.emergencyExpiresAt ?? null),
      },
      select: postFields,
    })
  }) as unknown as PrismaPostFull
  return toDomainPost(raw)
}

export const searchByDistance = async (
  lat: number,
  lng: number,
  radiusKm: number,
  category?: string,
): Promise<LocationSearchResult[]> => {
  await deleteExpiredEmergencyPosts()
  const hasCategory = !!category?.trim()

  const categoryFilter = hasCategory
    ? `AND EXISTS (
        SELECT 1 FROM PostCategory pc2
        JOIN Category c2 ON c2.id = pc2.categoryId
        WHERE pc2.postId = p.id AND c2.name = ?
      )`
    : ''

  const sql = `
    SELECT p.id,
      (6371 * ACOS(LEAST(GREATEST(
        COS(RADIANS(?)) * COS(RADIANS(p.latitude)) *
        COS(RADIANS(p.longitude) - RADIANS(?)) +
        SIN(RADIANS(?)) * SIN(RADIANS(p.latitude))
      , -1), 1))) AS distance
    FROM Post p
    WHERE p.status = 'Active'
      AND (p.type = 'Post' OR p.type = 'Emergency')
      AND p.latitude IS NOT NULL
      AND p.longitude IS NOT NULL
      ${categoryFilter}
    HAVING distance <= ?
    ORDER BY distance
  `

  const params: (string | number)[] = [lat, lng, lat]
  if (hasCategory) {
    params.push(category!.trim())
  }
  params.push(radiusKm)

  const rawResults = await prisma.$queryRawUnsafe<{ id: string; distance: number }[]>(sql, ...params)

  if (!Array.isArray(rawResults) || rawResults.length === 0) return []

  const ids = rawResults.map((r) => r.id)
  const distanceMap = new Map(rawResults.map((r) => [r.id, r.distance]))

  const posts = await prisma.post.findMany({
    where: { id: { in: ids } },
    select: postFields,
  }) as unknown as PrismaPostFull[]

  const results: (LocationSearchResult | null)[] = posts.map((p) => {
    const dist = distanceMap.get(p.id)
    if (dist === undefined) return null
    return { ...toDomainPost(p), distance: dist }
  })

  return results
    .filter((p): p is LocationSearchResult => p !== null)
    .sort((a, b) => a.distance - b.distance)
}

export const incrementPostFilledCount = (postId: string, categoryId?: string) =>
  prisma.postCategory.updateMany({
    where: { postId, ...(categoryId ? { id: categoryId } : {}) },
    data: { filledCount: { increment: 1 } },
  })

export const decrementPostFilledCount = (postId: string, categoryId?: string) =>
  prisma.postCategory.updateMany({
    where: { postId, filledCount: { gt: 0 }, ...(categoryId ? { id: categoryId } : {}) },
    data: { filledCount: { decrement: 1 } },
  })

export const findPostCategories = (postId: string) =>
  prisma.postCategory.findMany({
    where: { postId },
  })
