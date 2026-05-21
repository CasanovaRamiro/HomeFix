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

const assertPositiveId = (id: number, label: string) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
}

const assertValidStatus = (status: string) => {
  if (!PUBLICATION_STATUS_VALUES.includes(status as PublicationStatus)) {
    throw new Error(`Invalid status. Allowed: ${PUBLICATION_STATUS_VALUES.join(', ')}`)
  }
}

export const listAvailableByCategory = async (category: string) => {
  if (!category?.trim()) {
    throw new Error('Category is required')
  }
  return findAvailableByCategory(category.trim())
}

export const listAllAvailable = async (): Promise<Publication[]> =>
  findAllAvailable()

export const getPublicationById = async (id: number) => {
  assertPositiveId(id, 'Publication id')
  const publication = await findById(id)
  if (!publication) {
    throw new Error('Publication not found')
  }
  return publication
}

export const listPublicationsByUser = async (userId: number) => {
  assertPositiveId(userId, 'User id')
  return findByUserId(userId)
}

export const listPublicationsByUserAndStatus = async (
  userId: number,
  status: string
) => {
  assertPositiveId(userId, 'User id')
  assertValidStatus(status)
  return findByUserIdAndStatus(userId, status)
}
