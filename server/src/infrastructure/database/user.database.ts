import { Prisma } from '@prisma/client'
import prisma from '../../lib/prisma.js'
import type { CreateUserInput, DomainUser } from '../../domain/types/user.types.js'
import type { DomainClientReview } from '../../domain/types/review.types.js'
import type { DomainWorkerReview } from '../../domain/types/worker.types.js'

const publicFields = {
  id: true,
  name: true,
  email: true,
  phone: true,
  photo: true,
  role: true,
  createdAt: true,
} as const

export const findByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email } })

export const findUserById = (id: string) =>
  prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, telegramChatId: true },
  })

export const findAll = (): Promise<DomainUser[]> =>
  prisma.user.findMany({ select: publicFields })

const clientReviewFields = {
  id: true,
  rating: true,
  description: true,
  createdAt: true,
  reviewer: { select: { id: true, name: true } },
  client: { select: { id: true, name: true } },
} satisfies Prisma.ClientReviewSelect

type ClientReviewResult = Prisma.ClientReviewGetPayload<{ select: typeof clientReviewFields }>

const toDomainClientReview = (r: ClientReviewResult): DomainClientReview => ({
  id: r.id,
  rating: r.rating,
  description: r.description,
  createdAt: r.createdAt,
  reviewer: r.reviewer,
  client: r.client,
})

const workerReviewFields = {
  id: true,
  rating: true,
  description: true,
  mediaUrls: true,
  createdAt: true,
  reviewer: { select: { id: true, name: true } },
  application: {
    select: {
      postId: true,
      post: { select: { id: true, title: true } },
    },
  },
} satisfies Prisma.WorkerReviewSelect

type WorkerReviewResult = Prisma.WorkerReviewGetPayload<{ select: typeof workerReviewFields }>

const toDomainWorkerReview = (r: WorkerReviewResult): DomainWorkerReview => ({
  id: r.id,
  rating: r.rating,
  description: r.description,
  mediaUrls: r.mediaUrls,
  createdAt: r.createdAt,
  reviewer: r.reviewer,
  application: r.application,
})

export const findClientReviewsByUserId = (userId: string): Promise<DomainClientReview[]> =>
  prisma.clientReview
    .findMany({ where: { clientId: userId }, select: clientReviewFields, orderBy: { createdAt: 'desc' } })
    .then((raw) => raw.map(toDomainClientReview))

export const findWorkerReviewsByUserId = (userId: string): Promise<DomainWorkerReview[]> =>
  prisma.workerReview
    .findMany({ where: { workerId: userId }, select: workerReviewFields, orderBy: { createdAt: 'desc' } })
    .then((raw) => raw.map(toDomainWorkerReview))

export const getWorkerReviewAggregate = (userId: string) =>
  prisma.workerReview.aggregate({
    where: { workerId: userId },
    _avg: { rating: true },
    _count: true,
  })

export const getClientReviewAggregate = (userId: string) =>
  prisma.clientReview.aggregate({
    where: { clientId: userId },
    _avg: { rating: true },
    _count: true,
  })

const createDefaultDeps = async () => {
  const dni = await prisma.nationalIdType.upsert({
    where: { id: 'default-dni-id' },
    update: {},
    create: { id: 'default-dni-id', description: 'DNI' },
  })
  const addr = await prisma.address.upsert({
    where: { id: 'default-addr-id' },
    update: {},
    create: { id: 'default-addr-id', street: 'Sin especificar', number: '0', city: 'Buenos Aires', state: 'Buenos Aires' },
  })
  return { dniId: dni.id, addrId: addr.id }
}

export const createUser = async (data: CreateUserInput) => {
  const { dniId, addrId } = await createDefaultDeps()
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone ?? null,
      surname: data.surname ?? '',
      nationalId: data.nationalId ?? `${Date.now()}`,
      nationalIdTypeId: dniId,
      addressId: addrId,
      role: data.role ?? 'user',
    },
    select: publicFields,
  })
}

export const addUserCategories = async (userId: string, categoryIds: string[]) =>
  prisma.userCategory.createMany({
    data: categoryIds.map((categoryId) => ({ userId, categoryId })),
  })

export const updateEmergencyNotifications = (userId: string, enabled: boolean) =>
  prisma.user.update({
    where: { id: userId },
    data: { emergenciesEnabled: enabled },
    select: { id: true, emergenciesEnabled: true },
  })

export const updateUserByEmail = (
  email: string,
  data: Partial<{ email: string; name: string; role: string }>,
) =>
  prisma.user.update({
    where: { email },
    data,
    select: publicFields,
  })
