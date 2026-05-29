import prisma from '../lib/prisma.js'

export const listCategories = () =>
  prisma.category.findMany({ orderBy: { name: 'asc' } })
