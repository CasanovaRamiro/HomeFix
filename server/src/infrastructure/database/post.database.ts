import prisma from '../../lib/prisma.js'
import type { CreatePostInput, UpdatePostInput, DomainPost, DomainUserPost } from '../../domain/types/post.types.js'
import type { PrismaPostFull } from '../types/post.types.js'
import { toDomainPost } from '../transformers/post.transformer.js'
import { PostStatus } from '../../domain/types/postStatus.js'
import { ApplicationStatus } from '../../domain/types/applicationStatus.js'
import { EMERGENCY_DURATION_MS } from '../../domain/constants.js'

type _CreatePostRecordInput = {
  userId: string
  type: string
  parentPostId: string | null
  title: string
  description: string
  startDate: Date
  endDate: Date
  address: string
  latitude?: number | null
  longitude?: number | null
  isEmergency: boolean
  emergencyExpiresAt: Date | null
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
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      address: data.address,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      isEmergency: data.isEmergency,
      emergencyExpiresAt: data.emergencyExpiresAt,
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
  categories: {
    select: {
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
    type: 'post',
    parentPostId: null,
    title: data.title,
    description: data.description,
    startDate,
    endDate,
    address: data.address,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    isEmergency: data.isEmergency ?? false,
    emergencyExpiresAt: data.emergencyExpiresAt ?? null,
    images: data.images,
    categories: [{ categoryId: data.categoryId }],
  })
}

export const createSubPost = async (data: {
  userId: string
  parentPostId?: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  address: string
  positions: { categoryId: string; quantity: number; roleDescription: string }[]
}): Promise<DomainPost> =>
  _createPostRecord({
    userId: data.userId,
    type: 'subcontract',
    parentPostId: data.parentPostId ?? null,
    title: data.title,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    address: data.address,
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

export interface PaginatedPosts {
  posts: DomainPost[]
  total: number
}

export const findAvailablePosts = async (
  category?: string,
  pagination?: PaginationParams,
): Promise<PaginatedPosts> => {
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

export const findEmergencyPosts = async (category?: string): Promise<DomainPost[]> => {
  const raw = await prisma.post.findMany({
    where: {
      ...availablePostWhere(category),
      isEmergency: true,
      emergencyExpiresAt: { gt: new Date() },
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
    where: { userId, status: { in: [PostStatus.Active, PostStatus.InProgress, PostStatus.Paused, PostStatus.Completed] } },
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
        emergencyExpiresAt: data.emergencyExpiresAt ?? null,
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
