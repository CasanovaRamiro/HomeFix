import prisma from '../lib/prisma.js'

const publicFields = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  dni: true,
  photo: true,
  role: true,
  active: true,
  phone: true,
  createdAt: true,
  dniType: {
    select: {
      id: true,
      description: true,
    },
  },
  address: {
    select: {
      id: true,
      street: true,
      number: true,
      city: true,
      province: true,
    },
  },
}

export interface CreateUserInput {
  firstName: string
  lastName: string
  email: string
  password: string
  dni: string
  phone?: string
  photo?: string
  dniTypeId: number
  address: {
    street: string
    number: string
    city: string
    province: string
  }
}

export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } })

export const findById = (id: number) =>
  prisma.user.findUnique({ where: { id }, select: publicFields })

export const findAll = () =>
  prisma.user.findMany({ where: { deleted: false }, select: publicFields })

export const createUser = ({ dniTypeId, address, ...rest }: CreateUserInput) =>
  prisma.user.create({
    data: {
      ...rest,
      dniType: { connect: { id: dniTypeId } },
      address: { create: address },
    },
    select: publicFields,
  })
