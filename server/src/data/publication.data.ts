import { PrismaClient, Publication } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Busca todas las publicaciones disponibles por su categoría
 * @param category El tipo de publicación (ej: 'Electricista')
 */
export const findAvailableByCategory = async (category: string) => {
  return await prisma.publication.findMany({
    where: {
      typePublication: category,
      status: 'disponible', // Filtramos solo las que están libres/disponibles
    },
    orderBy: {
      date: 'desc', // Las más recientes primero
    },
  })
}


export const findAllAvailable = async (): Promise<Publication[]> => {
  return await prisma.publication.findMany({
    where: {
      status: 'disponible',
    },
  });
}

