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
  aiGenerated?: boolean
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
      aiGenerated: data.aiGenerated ?? false,
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
  aiGenerated: true,
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
    aiGenerated: data.aiGenerated ?? false,
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
  OR: [
    { type: PostType.Post, isEmergency: false },
    { type: PostType.Emergency, emergencyExpiresAt: { gt: new Date() } },
  ],
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

export const selectBiddingWinner = (
  biddingId: string,
  applicationId: string,
  currentStatus: string,
): Promise<{ id: string; status: string }> =>
  prisma.$transaction(async (tx) => {
    const claimed = await tx.post.updateMany({
      where: {
        id: biddingId,
        isBidding: true,
        status: currentStatus,
      },
      data: { status: PostStatus.InProgress },
    })
    if (claimed.count === 0) {
      throw Object.assign(
        new Error('La licitación debe estar activa o en evaluación para seleccionar ganador'),
        { status: 400 },
      )
    }

    const accepted = await tx.application.updateMany({
      where: {
        id: applicationId,
        postId: biddingId,
        status: ApplicationStatus.Pending,
      },
      data: { status: ApplicationStatus.Accepted },
    })
    if (accepted.count === 0) {
      const application = await tx.application.findUnique({
        where: { id: applicationId },
        select: { postId: true },
      })
      if (!application || application.postId !== biddingId) {
        throw Object.assign(new Error('La postulación no pertenece a esta licitación'), { status: 400 })
      }
      throw Object.assign(new Error('La postulación no está pendiente'), { status: 400 })
    }

    await tx.application.updateMany({
      where: { postId: biddingId, status: ApplicationStatus.Pending, id: { not: applicationId } },
      data: { status: ApplicationStatus.Rejected },
    })
    return { id: biddingId, status: PostStatus.InProgress }
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
      AND (
        (p.type = ? AND p.isEmergency = 0)
        OR (p.type = ? AND p.emergencyExpiresAt > ?)
      )
      AND p.latitude IS NOT NULL
      AND p.longitude IS NOT NULL
      ${categoryFilter}
    HAVING distance <= ?
    ORDER BY distance
  `

  const params: (string | number | Date)[] = [lat, lng, lat, PostType.Post, PostType.Emergency, new Date()]
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

export const reopenPosts = async (postIds: string[]): Promise<void> => {
  if (postIds.length === 0) return

  await prisma.$transaction(async (tx) => {
    const reopened = await tx.post.updateMany({
      where: { id: { in: postIds }, status: PostStatus.InProgress },
      data: { status: PostStatus.Active },
    })
    if (reopened.count !== postIds.length) {
      throw Object.assign(new Error('Post must be in progress to be reopened'), { status: 400 })
    }

    const applications = await tx.application.findMany({
      where: {
        postId: { in: postIds },
        status: { in: [ApplicationStatus.Accepted, ApplicationStatus.Completed] },
      },
      select: { id: true, status: true, categoryId: true },
    })

    for (const application of applications) {
      if (application.status !== ApplicationStatus.Accepted || !application.categoryId) continue

      const decremented = await tx.postCategory.updateMany({
        where: { id: application.categoryId, postId: { in: postIds }, filledCount: { gt: 0 } },
        data: { filledCount: { decrement: 1 } },
      })
      if (decremented.count === 0) {
        throw new Error('Post category filled count is inconsistent')
      }
    }

    if (applications.length > 0) {
      await tx.application.updateMany({
        where: { id: { in: applications.map((application) => application.id) } },
        data: { status: ApplicationStatus.Pending },
      })
    }
  })
}

export const findPostCategories = (postId: string) =>
  prisma.postCategory.findMany({
    where: { postId },
  })

export const findAvailableBiddingPosts = async (workerId?: string) => {
  const raw = await prisma.post.findMany({
    where: { isBidding: true, status: 'Active', endDate: { gte: new Date() } } as never,
    orderBy: { createdAt: 'desc' },
    select: {
      ...postFields,
      applications: workerId
        ? { where: { workerId }, select: { id: true }, take: 1 }
        : false,
    },
  }) as unknown as (PrismaPostFull & { applications?: { id: string }[] })[]
  return raw.map((p) => ({
    ...toDomainPost(p),
    hasApplied: workerId ? (p.applications?.length ?? 0) > 0 : false,
  }))
}

export const findWorkerAppBiddings = async (workerId: string) => {
  const raw = await prisma.application.findMany({
    where: { workerId, post: { isBidding: true } } as never,
    orderBy: { createdAt: 'desc' },
    include: {
      clientReview: { select: { id: true } },
      post: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          budgetMax: true,
          materialResponsibility: true,
          user: { select: { id: true, name: true, surname: true } },
          categories: { include: { category: { select: { id: true, name: true } } } },
        },
      },
    },
  })
  return raw.map((a) => ({
    applicationId: a.id,
    status: a.status,
    hasReview: a.clientReview !== null,
    offeredCost: a.visitCost,
    offeredDuration: a.offeredDuration,
    offeredStartDate: a.scheduledDate?.toISOString() ?? null,
    message: a.message,
    createdAt: a.createdAt.toISOString(),
    bidding: {
      id: a.post.id,
      title: a.post.title,
      description: a.post.description,
      budgetMax: a.post.budgetMax,
      materialResponsibility: a.post.materialResponsibility,
      status: a.post.status,
      categories: a.post.categories.map((pc) => ({ id: pc.category.id, name: pc.category.name })),
      client: { id: a.post.user.id, name: a.post.user.name, surname: a.post.user.surname },
    },
  }))
}

export const updateSubcontractGroup = async (
  groupId: string,
  data: {
    title: string
    description: string
    startDate: Date
    endDate: Date
    address: string
    latitude?: number | null
    longitude?: number | null
    positions?: { id?: string; categoryId: string; quantity: number; roleDescription: string }[]
  }
): Promise<DomainPost[]> => {
  await prisma.$transaction(async (tx) => {
    const posts = await tx.post.findMany({
      where: { subcontractGroupId: groupId } as never,
      select: {
        id: true,
        userId: true,
        parentPostId: true,
        applications: { select: { id: true } },
        categories: {
          select: {
            id: true,
            categoryId: true,
            quantity: true,
            filledCount: true,
            roleDescription: true,
            applications: { select: { id: true } },
          },
        },
      },
    })

    const categoryById = new Map(posts.flatMap((post) => post.categories.map((category) => [category.id, { ...category, postId: post.id }])))
    const positions = data.positions
    const existingIds = new Set<string>()

    if (positions) {
      for (const position of positions) {
        if (!position.categoryId || !Number.isInteger(position.quantity) || position.quantity < 1 || !position.roleDescription.trim()) {
          throw Object.assign(new Error('Invalid subcontract position'), { status: 400 })
        }
        if (position.id !== undefined) {
          if (!position.id || existingIds.has(position.id) || !categoryById.has(position.id)) {
            throw Object.assign(new Error('Invalid or duplicate subcontract position id'), { status: 400 })
          }
          existingIds.add(position.id)
          const current = categoryById.get(position.id)!
          if (position.quantity < current.filledCount) {
            throw Object.assign(new Error('Position quantity cannot be lower than filled positions'), { status: 400 })
          }
          if (current.applications.length > 0 && position.categoryId !== current.categoryId) {
            throw Object.assign(new Error('A contracted position cannot change category'), { status: 400 })
          }
        }
      }

      for (const [id, current] of categoryById) {
        if (existingIds.has(id)) continue
        if (current.filledCount > 0 || current.applications.length > 0) {
          throw Object.assign(new Error('A position with applications or contracts cannot be removed'), { status: 400 })
        }
      }
    }

    for (const post of posts) {
      await tx.post.update({
        where: { id: post.id },
        data: {
          title: data.title,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          address: data.address,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        },
      })

      if (positions) {
        for (const position of positions.filter((item) => item.id && categoryById.get(item.id)?.postId === post.id)) {
          await tx.postCategory.update({
            where: { id: position.id },
            data: {
              categoryId: position.categoryId,
              quantity: position.quantity,
              roleDescription: position.roleDescription,
            },
          })
        }

        for (const category of post.categories) {
          if (existingIds.has(category.id)) continue
          await tx.postCategory.delete({ where: { id: category.id } })
        }

        const retainedCategories = post.categories.filter((category) => existingIds.has(category.id))
        if (retainedCategories.length === 0 && post.applications.length === 0) {
          await tx.post.delete({ where: { id: post.id } })
        }
      }
    }

    if (positions) {
      const template = posts[0]
      if (!template && positions.length > 0) {
        throw Object.assign(new Error('Subcontract group not found'), { status: 404 })
      }
      for (const position of positions.filter((item) => !item.id)) {
        await tx.post.create({
          data: {
            userId: template.userId,
            type: PostType.SubContract,
            parentPostId: template.parentPostId,
            subcontractGroupId: groupId,
            title: data.title,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            address: data.address,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            isEmergency: false,
            emergencyExpiresAt: null,
            allowsSubcontracting: true,
            isBidding: false,
            categories: {
              create: {
                categoryId: position.categoryId,
                quantity: position.quantity,
                roleDescription: position.roleDescription,
              },
            },
          },
        })
      }
    }
  })

  const updated = await prisma.post.findMany({
    where: { subcontractGroupId: groupId } as never,
    select: postFields,
  }) as unknown as PrismaPostFull[]

  return updated.map(toDomainPost)
}
