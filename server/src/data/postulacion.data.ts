import prisma from "../lib/prisma.js"

export const findPostulacionesByTrabajador = (trabajadorId: string) =>
  prisma.postulacion.findMany({
    where: { trabajadorId },
    include: {
      post: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

export const findPostulacion = (trabajadorId: string, postId: string) =>
  prisma.postulacion.findUnique({
    where: { trabajadorId_postId: { trabajadorId, postId } },
  })

export const createPostulacion = (trabajadorId: string, postId: string) =>
  prisma.postulacion.create({
    data: { trabajadorId, postId, estado: "Pendiente" },
  })
