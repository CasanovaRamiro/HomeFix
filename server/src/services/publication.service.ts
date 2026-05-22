import type { Publication } from '@prisma/client'
import {
  findAvailableByCategory,
  findAllAvailable,
  findById,
  findByUserId,
  findByUserIdAndStatus
} from '../data/publication.data.js'
import {
  PUBLICATION_STATUS_VALUES,
  type PublicationStatus,
} from '../types/publication.types.js'

// Se agrega ': void' porque esta función solo valida y no retorna ningún valor
const assertPositiveId = (id: number, label: string): void => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
}

// Se agrega ': void' por la misma razón
const assertValidStatus = (status: string): void => {
  if (!PUBLICATION_STATUS_VALUES.includes(status as PublicationStatus)) {
    throw new Error(`Invalid status. Allowed: ${PUBLICATION_STATUS_VALUES.join(', ')}`)
  }
}

// Retorna una Promesa que resuelve a un Array de Publicaciones
export const listAvailableByCategory = async (category: string): Promise<Publication[]> => {
  if (!category?.trim()) {
    throw new Error('Category is required')
  }
  return findAvailableByCategory(category.trim())
}

export const listAllAvailable = async (): Promise<Publication[]> =>
  findAllAvailable()

// Retorna una Promesa que resuelve a una Publicación
export const getPublicationById = async (id: number): Promise<Publication> => {
  assertPositiveId(id, 'Publication id')
  const publication = await findById(id)
  if (!publication) {
    throw new Error('Publication not found')
  }
  return publication
}

// Retorna una Promesa que resuelve a un Array de Publicaciones
export const listPublicationsByUser = async (userId: number): Promise<Publication[]> => {
  assertPositiveId(userId, 'User id')
  return findByUserId(userId)
}

// Retorna una Promesa que resuelve a un Array de Publicaciones
export const listPublicationsByUserAndStatus = async (
  userId: number,
  status: string
): Promise<Publication[]> => {
  assertPositiveId(userId, 'User id')
  assertValidStatus(status)
  return findByUserIdAndStatus(userId, status)
}