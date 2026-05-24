import prisma from '../lib/prisma.js'
import { Prisma } from '@prisma/client'

const workerFields = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect

type WorkerResult = Prisma.UserGetPayload<{ select: typeof workerFields }>

export const findWorkerById = (id: number): Promise<WorkerResult | null> =>
  prisma.user.findFirst({
    where: { id, role: 'worker' },
    select: workerFields,
  })

export const findAllWorkers = (): Promise<WorkerResult[]> =>
  prisma.user.findMany({
    where: { role: 'worker' },
    select: workerFields,
  })
