import prisma from "../lib/prisma.js"

export const findApplicationsByWorker = (workerId: string) =>
  prisma.application.findMany({
    where: { workerId, status: { not: "Rejected" } },
    include: {
      post: {
        include: {
          user: { select: { id: true, name: true, surname: true } },
          categories: { include: { category: { select: { name: true } } } },
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

export const createApplication = (workerId: string, postId: string) =>
  prisma.application.create({
    data: { workerId, postId, status: "Pending" },
  })

export const deleteApplication = (workerId: string, applicationId: string) =>
  prisma.application.deleteMany({
    where: { id: applicationId, workerId, status: 'Pending' },
  })

export const findAcceptedApplication = (postId: string) =>
  prisma.application.findFirst({
    where: { postId, status: "Accepted" },
  })

export const findApplicationsByPost = (postId: string) =>
  prisma.application.findMany({
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
            where: { status: "Completed" },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
