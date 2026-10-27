import type { PrismaClient } from '@prisma/client'

export const CATEGORY_NAMES = [
  'Electricidad', 'Plomería', 'Carpintería', 'Pintura',
  'Albañilería', 'Cerrajería', 'Aire / HVAC', 'Electrónica',
] as const

export async function initializeCategoryCatalog(db: Pick<PrismaClient, 'category'>): Promise<number> {
  // Add missing master data only. Keep existing IDs, custom categories and links.
  const { count } = await db.category.createMany({
    data: CATEGORY_NAMES.map((name) => ({ name })),
    skipDuplicates: true,
  })
  return count
}
