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

export const createApplication = (workerId: string, postId: string) =>
  prisma.application.create({
    data: { workerId, postId, status: "Pending" },
  })
