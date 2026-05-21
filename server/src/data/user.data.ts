import prisma from '../lib/prisma.js'
import type { Prisma } from '@prisma/client'

interface CreateUserInput {
  name: string
  email: string
  password: string
  phone?: string
  surname?: string
  nationalId?: string
  role?: string
}

const publicFields = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } })

export const findAll = () =>
  prisma.user.findMany({ select: publicFields })

export const createUser = (data: Prisma.UserCreateInput) =>
  prisma.user.create({ data, select: publicFields })

export const addUserCategories = async (userId: string, categoryIds: string[]) => {
  return prisma.userCategory.createMany({
    data: categoryIds.map(categoryId => ({
      userId,
      categoryId
    }))
  })
}
