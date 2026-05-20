import prisma from '../lib/prisma.js'

const publicFields = { id: true, name: true, email: true, phone: true, role: true, createdAt: true }

export const findByEmail = (email) =>
  prisma.user.findUnique({ where: { email } })

export const findAll = () =>
  prisma.user.findMany({ select: publicFields })

export const createUser = (data) =>
  prisma.user.create({ data, select: publicFields })
