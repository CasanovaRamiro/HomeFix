import prisma from '../../lib/prisma.js'
import { Prisma } from '@prisma/client'
import { UserRole } from '../../domain/types/userRole.js'
import { toDomainWorker } from '../transformers/worker.transformer.js'
import type { DomainWorker, UpdateWorkerInput } from '../../domain/types/worker.types.js'

const workerFields = {
  id: true,
  name: true,
  email: true,
  phone: true,
  bio: true,
  role: true,
  photo: true,
  createdAt: true,
  categories: {
    select: {
      category: {
        select: { id: true, name: true },
      },
    },
  },
} satisfies Prisma.UserSelect

export type WorkerResult = Prisma.UserGetPayload<{ select: typeof workerFields }>

export const findWorkerById = async (id: string): Promise<DomainWorker | null> => {
  const raw = await prisma.user.findFirst({
    where: { id, role: UserRole.Worker },
    select: workerFields,
  })
  return raw ? toDomainWorker(raw) : null
}

export const updateWorker = async (id: string, input: UpdateWorkerInput): Promise<DomainWorker> => {
  const { categoryIds, ...data } = input
  const raw = await prisma.user.update({
    where: { id },
    data: {
      ...data,
      ...(categoryIds
        ? {
            categories: {
              deleteMany: {},
              create: categoryIds.map((categoryId) => ({ categoryId })),
            },
          }
        : {}),
    },
    select: workerFields,
  })
  return toDomainWorker(raw)
}

export const findAllWorkers = async (): Promise<DomainWorker[]> => {
  const raw = await prisma.user.findMany({
    where: { role: UserRole.Worker },
    select: workerFields,
  })
  return raw.map(toDomainWorker)
}
