import prisma from "../lib/prisma.js"

export const findPostulacionesByTrabajador = (trabajadorId: number) =>
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

export const findPostulacion = (trabajadorId: number, postId: number) =>
  prisma.postulacion.findUnique({
    where: { trabajadorId_postId: { trabajadorId, postId } },
  })

export const createPostulacion = (trabajadorId: number, postId: number) =>
  prisma.postulacion.create({
    data: { trabajadorId, postId, estado: "Pendiente" },
  })
