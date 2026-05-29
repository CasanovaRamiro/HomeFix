import prisma from '../lib/prisma.js'
import { Prisma } from '@prisma/client'
import { UserRole } from '../types/userRole.js'

const workerFields = {
  id: true,
  name: true,
  email: true,
  phone: true,
  bio: true,
  role: true,
  createdAt: true,
  categories: {
    select: {
      category: {
        select: { id: true, name: true },
      },
    },
  },
} satisfies Prisma.UserSelect

type WorkerResult = Prisma.UserGetPayload<{ select: typeof workerFields }>

export const findWorkerById = (id: string): Promise<WorkerResult | null> =>
  prisma.user.findFirst({
    where: { id, role: UserRole.Worker },
    select: workerFields,
  })

export const findAllWorkers = (): Promise<WorkerResult[]> =>
  prisma.user.findMany({
    where: { role: UserRole.Worker },
    select: workerFields,
  })
