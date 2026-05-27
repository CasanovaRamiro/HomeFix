import prisma from '../lib/prisma.js'

interface CreateUserInput {
  name: string
  email: string
  password: string
  phone?: string
  surname?: string
  nationalId: string
  role?: string
}

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

export const createUser = async (data: CreateUserInput) => {
  const nationalIdType = await prisma.nationalIdType.findFirst({
    where: { description: 'DNI' },
  }) ?? await prisma.nationalIdType.create({
    data: { description: 'DNI' },
  })

  const userData = {
    name: data.name,
    surname: data.surname ?? '',
    email: data.email,
    password: data.password,
    phone: data.phone,
    role: data.role ?? 'user',
    nationalId: data.nationalId,
    nationalIdType: { connect: { id: nationalIdType.id } },
    address: {
      create: {
        street: '',
        number: '',
        city: '',
        state: '',
      },
    },
  }

  return prisma.user.create({ data: userData, select: publicFields })
}
