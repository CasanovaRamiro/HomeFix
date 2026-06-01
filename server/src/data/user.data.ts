import prisma from '../lib/prisma.js'

const publicFields = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} as const

export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } })

export const findAll = () =>
  prisma.user.findMany({ select: publicFields })

interface CreateUserInput {
  name: string
  email: string
  password: string
  phone?: string
  role?: string
}

export const createUser = async (data: CreateUserInput) => {
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone ?? null,
      role: data.role ?? 'user',
    },
    select: publicFields,
  })
}

export const addUserCategories = async (userId: string, categoryIds: string[]) => {
  return prisma.userCategory.createMany({
    data: categoryIds.map(categoryId => ({
      userId,
      categoryId
    }))
  })
}
