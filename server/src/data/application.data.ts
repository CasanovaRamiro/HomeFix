import prisma from "../lib/prisma.js"

export const findApplicationsByWorker = (workerId: string) =>
  prisma.application.findMany({
    where: { workerId },
    include: {
      post: {
        include: {
          user: {
            select: { id: true, name: true, surname: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

export const findApplication = (workerId: string, postId: string) =>
  prisma.application.findUnique({
    where: { workerId_postId: { workerId, postId } },
  })

export const findApplicationById = (id: string) =>
  prisma.application.findUnique({
    where: { id },
    include: {
      post: { select: { userId: true, status: true } },
    },
  })

export const updateApplicationStatus = (id: string, status: string) =>
  prisma.application.update({
    where: { id },
    data: { status },
  })

export const rejectOtherApplications = (postId: string, acceptedApplicationId: string) =>
  prisma.application.updateMany({
    where: { postId, status: "Pending", id: { not: acceptedApplicationId } },
    data: { status: "Rejected" },
  })

export const createApplication = (workerId: string, postId: string) =>
  prisma.application.create({
    data: { workerId, postId, status: "Pending" },
  })
