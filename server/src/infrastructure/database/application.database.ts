import { ApplicationStatus } from '../../domain/types/applicationStatus.js'
import prisma from '../../lib/prisma.js'
import { toDomainMyApplication, toDomainPostApplication } from '../transformers/application.transformer.js'
import type { CreateApplicationInput, DomainMyApplication, DomainPostApplication } from '../../domain/types/application.types.js'
import type { Prisma } from '@prisma/client'

export const findApplicationsByWorker = async (workerId: string): Promise<DomainMyApplication[]> => {
  const raw = await prisma.application.findMany({
    where: { workerId, status: { notIn: [ApplicationStatus.Rejected, ApplicationStatus.Dismissed] } },
    include: {
      post: {
        include: {
          user: { select: { id: true, name: true, surname: true, phone: true } },
          categories: { include: { category: { select: { name: true } } } },
        },
      },
      category: { include: { category: { select: { name: true } } } },
      clientReview: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return raw.map(toDomainMyApplication)
}

export const findApplication = (workerId: string, postId: string, categoryId?: string) => {
  const where: Prisma.ApplicationFindFirstArgs['where'] = { workerId, postId }
  if (categoryId) where.categoryId = categoryId
  return prisma.application.findFirst({ where })
}

export const findApplicationById = (id: string) =>
  prisma.application.findUnique({
    where: { id },
    include: {
      post: { select: { userId: true, title: true, status: true, type: true, subcontractGroupId: true } },
      category: { select: { id: true, quantity: true, filledCount: true } },
    },
  })

export const updateApplicationStatus = (id: string, status: string) =>
  prisma.application.update({
    where: { id },
    data: { status },
  })

export const rejectPendingApplications = (postId: string) =>
  prisma.application.updateMany({
    where: { postId, status: ApplicationStatus.Pending },
    data: { status: ApplicationStatus.Rejected },
  })

export const createApplication = (workerId: string, input: CreateApplicationInput) =>
  prisma.application.create({
    data: {
      workerId,
      postId: input.postId,
      categoryId: input.categoryId ?? null,
      subcontractGroupId: input.subcontractGroupId ?? null,
      status: ApplicationStatus.Pending,
      message: input.message ?? null,
      availableDays: input.availableDays ? JSON.stringify(input.availableDays) : null,
      availableTimeFrom: input.availableTimeFrom ?? null,
      availableTimeTo: input.availableTimeTo ?? null,
      chargesVisit: input.chargesVisit ?? false,
      visitCost: input.visitCost ?? null,
      offeredDuration: input.offeredDuration ?? null,
      scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : undefined,
    },
  })

export const deleteApplication = (workerId: string, applicationId: string) =>
  prisma.application.deleteMany({
    where: { id: applicationId, workerId, status: ApplicationStatus.Pending },
  })

export const findAcceptedApplication = (postId: string) =>
  prisma.application.findFirst({
    where: { postId, status: { in: [ApplicationStatus.Accepted, ApplicationStatus.Completed] } },
  })

export const findAcceptedApplications = (postId: string) =>
  prisma.application.findMany({
    where: { postId, status: { in: [ApplicationStatus.Accepted, ApplicationStatus.Completed] } },
  })

export const findBiddingApplications = async (biddingId: string) => {
  const raw = await prisma.application.findMany({
    where: { postId: biddingId },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          surname: true,
          photo: true,
          phone: true,
          reviewsReceived: { select: { rating: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
  return raw.map((a) => {
    const ratings = a.worker.reviewsReceived.map((r) => r.rating)
    const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0
    return {
      id: a.id,
      workerId: a.workerId,
      workerName: `${a.worker.name} ${a.worker.surname}`,
      workerPhoto: a.worker.photo,
      workerPhone: a.worker.phone,
      workerRating: avgRating,
      workerReviewCount: ratings.length,
      status: a.status,
      message: a.message,
      offeredCost: a.visitCost,
      offeredDuration: a.offeredDuration,
      offeredStartDate: a.scheduledDate?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    }
  })
}

export const findApplicationsByPost = async (postId: string): Promise<DomainPostApplication[]> => {
  const raw = await prisma.application.findMany({
    where: { postId },
    include: {
      worker: {
        include: {
          categories: {
            include: {
              category: { select: { name: true } },
            },
          },
          address: true,
          reviewsReceived: true,
          applications: {
            where: { status: ApplicationStatus.Completed },
            select: { id: true },
          },
        },
      },
      review: { select: { id: true } },
      category: { include: { category: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return raw.map(toDomainPostApplication)
}
