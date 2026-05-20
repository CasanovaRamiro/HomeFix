import { Publication } from '@prisma/client';
import { findAvailableByCategory, findAllAvailable } from '../data/publication.data.js'

export const listAvailableByCategory = async (category: string) => {
  if (!category || category.trim() === '') {
    throw new Error('Category is required')
  }

  return findAvailableByCategory(category)
}

export const listAllAvailable = async (): Promise<Publication[]> => {
  const publications = await findAllAvailable();
  return publications;
};