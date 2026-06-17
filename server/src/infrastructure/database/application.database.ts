import { ApplicationStatus } from '../../domain/types/applicationStatus.js'
import prisma from '../../lib/prisma.js'
import { toDomainMyApplication, toDomainPostApplication } from '../transformers/application.transformer.js'
import type { CreateApplicationInput, DomainMyApplication, DomainPostApplication } from '../../domain/types/application.types.js'

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
      clientReview: { select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return raw.map(toDomainMyApplication)
}

export const findApplication = (workerId: string, postId: string) =>
  prisma.application.findUnique({
    where: { workerId_postId: { workerId, postId } },
  })

export const findApplicationById = (id: string) =>
  prisma.application.findUnique({
    where: { id },
    include: {
      post: { select: { userId: true, title: true, status: true, type: true } },
    },
  })

export const updateApplicationStatus = (id: string, status: string) =>
  prisma.application.update({
    where: { id },
    data: { status },
  })

export const createApplication = (workerId: string, input: CreateApplicationInput) =>
  prisma.application.create({
    data: {
      workerId,
      postId: input.postId,
      status: ApplicationStatus.Pending,
      message: input.message ?? null,
      availableDays: JSON.stringify(input.availableDays),
      availableTimeFrom: input.availableTimeFrom,
      availableTimeTo: input.availableTimeTo,
      chargesVisit: input.chargesVisit,
      visitCost: input.visitCost ?? null,
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
    },
    orderBy: { createdAt: 'desc' },
  })
  return raw.map(toDomainPostApplication)
}
