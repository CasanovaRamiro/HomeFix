import prisma from '../../lib/prisma.js'
import { UserRole } from '../../domain/types/userRole.js'
import type { DomainWorkerProfile } from '../../domain/types/workerDashboard.types.js'

export const findWorkerProfile = async (workerId: string): Promise<DomainWorkerProfile | null> => {
  const raw = await prisma.user.findFirst({
    where: { id: workerId, role: UserRole.Worker },
    select: {
      id: true,
      name: true,
      surname: true,
      email: true,
      phone: true,
      bio: true,
      role: true,
      createdAt: true,
      address: {
        select: { street: true, number: true, city: true, state: true },
      },
      categories: {
        select: {
          category: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!raw) return null

  return {
    id: raw.id,
    name: raw.name,
    surname: raw.surname,
    email: raw.email,
    phone: raw.phone,
    bio: raw.bio,
    createdAt: raw.createdAt,
    location: raw.address ? `${raw.address.city}, ${raw.address.state}` : null,
    categories: raw.categories.map((c) => c.category),
  }
}

export const countWorkerReviews = async (workerId: string) => {
  const result = await prisma.workerReview.aggregate({
    where: { workerId },
    _count: true,
    _avg: { rating: true },
  })
  return {
    count: result._count,
    avgRating: result._avg.rating ?? 0,
  }
}

export const countWorkerApplications = (workerId: string) =>
  prisma.application.groupBy({
    by: ['status'],
    where: { workerId },
    _count: true,
  })

export const countNewJobsForWorker = async (workerCategoryIds: string[]) => {
  if (workerCategoryIds.length === 0) return 0
  return prisma.post.count({
    where: {
      status: 'Active',
      categories: {
        some: { categoryId: { in: workerCategoryIds } },
      },
    },
  })
}

export const countCompletedJobs = (workerId: string) =>
  prisma.application.count({
    where: { workerId, status: 'Completed' },
  })
