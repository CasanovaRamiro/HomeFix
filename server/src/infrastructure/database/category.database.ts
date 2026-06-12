import prisma from '../../lib/prisma.js'
import type { DomainCategory } from '../../domain/types/category.types.js'

export const listCategories = (): Promise<DomainCategory[]> =>
  prisma.category.findMany({ orderBy: { name: 'asc' } })

export const upsertCategoryByName = (name: string): Promise<DomainCategory> =>
  prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
  })
