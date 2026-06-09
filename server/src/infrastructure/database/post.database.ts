import prisma from '../../lib/prisma.js'
import type { CreatePostInput, UpdatePostInput, DomainPost, DomainUserPost } from '../../domain/types/post.types.js'
import type { PrismaPostFull } from '../types/post.types.js'
import { toDomainPost } from '../transformers/post.transformer.js'

const postFields = {
  id: true,
  userId: true,
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
  categories: {
    select: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
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
  const raw = await prisma.post.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      address: data.address,
      categories: {
        create: { categoryId: data.categoryId },
      },
      ...(data.images?.length ? {
        images: {
          create: data.images.map((img) => ({ url: img.url })),
        },
      } : {}),
    },
    select: postFields,
  }) as unknown as PrismaPostFull
  return toDomainPost(raw)
}

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

export const findAvailablePosts = async (category?: string): Promise<DomainPost[]> => {
  const raw = await prisma.post.findMany({
    where: availablePostWhere(category),
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
    where: { userId, status: { in: ['Active', 'In progress', 'Paused', 'Completed'] } },
    include: {
      categories: { include: { category: true } },
      applications: {
        include: { worker: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
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
  const raw = await prisma.$transaction(async (tx) => {
    await tx.postCategory.deleteMany({ where: { postId: id } })
    await tx.postCategory.create({ data: { postId: id, categoryId: data.categoryId } })
    return tx.post.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        address: data.address,
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
