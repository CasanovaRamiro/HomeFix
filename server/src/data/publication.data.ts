import type { Publication} from '@prisma/client'
import prisma from '../lib/prisma.js'

/**
 * Busca todas las publicaciones disponibles por su categoría
 * @param category El tipo de publicación (ej: 'Electricista')
 */
export const findAvailableByCategory = (category: string) =>
  prisma.publication.findMany({
    where: {
      typePublication: category,
      status: 'disponible',
    },
    orderBy: { date: 'desc' },
  })

export const findAllAvailable = (): Promise<Publication[]> =>
  prisma.publication.findMany({
    where: { status: 'disponible' },
    orderBy: { date: 'desc' },
  })

export const findById = (id: number) =>
  prisma.publication.findUnique({ where: { id } })

export const findByUserId = (userId: number) =>
  prisma.publication.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })

export const findByUserIdAndStatus = (userId: number, status: string) =>
  prisma.publication.findMany({
    where: { userId, status },
    orderBy: { date: 'desc' },
  })

