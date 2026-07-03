import prisma from '../../lib/prisma.js'
import { Prisma } from '@prisma/client'
import { PostStatus } from '../../domain/types/postStatus.js'
import { toDomainClientProfileBase } from '../transformers/clientProfile.transformer.js'
import type { DomainClientProfileBase } from '../transformers/clientProfile.transformer.js'
import type { UpdateClientProfileInput } from '../../domain/types/clientProfile.types.js'

const clientProfileFields = {
  id: true,
  name: true,
  surname: true,
  email: true,
  phone: true,
  bio: true,
  role: true,
  photo: true,
  createdAt: true,
  address: {
    select: { street: true, number: true, city: true, state: true },
  },
} satisfies Prisma.UserSelect

export type ClientProfileResult = Prisma.UserGetPayload<{ select: typeof clientProfileFields }>

export const findClientProfileById = async (id: string): Promise<DomainClientProfileBase | null> => {
  const raw = await prisma.user.findUnique({ where: { id }, select: clientProfileFields })
  return raw ? toDomainClientProfileBase(raw) : null
}

export const updateClientProfile = async (
  id: string,
  input: UpdateClientProfileInput,
): Promise<DomainClientProfileBase> => {
  const raw = await prisma.user.update({
    where: { id },
    data: input,
    select: clientProfileFields,
  })
  return toDomainClientProfileBase(raw)
}

export const countCompletedPostsByClientId = (id: string): Promise<number> =>
  prisma.post.count({ where: { userId: id, status: PostStatus.Completed } })
