import prisma from '../../lib/prisma.js'
import { Prisma } from '@prisma/client'
import { toDomainClientReview } from '../transformers/clientReview.transformer.js'
import type { DomainClientReview } from '../../domain/types/clientReview.types.js'

const clientReviewFields = {
  id: true,
  rating: true,
  description: true,
  createdAt: true,
  reviewer: {
    select: { id: true, name: true },
  },
  client: {
    select: { id: true, name: true },
  },
} satisfies Prisma.ClientReviewSelect

export type ClientReviewResult = Prisma.ClientReviewGetPayload<{ select: typeof clientReviewFields }>

export interface CreateClientReviewData {
  applicationId: string
  reviewerId: string
  clientId: string
  rating: number
  description?: string
}

export const createClientReview = async (data: CreateClientReviewData): Promise<DomainClientReview> => {
  const raw = await prisma.clientReview.create({
    data: {
      applicationId: data.applicationId,
      reviewerId: data.reviewerId,
      clientId: data.clientId,
      rating: data.rating,
      description: data.description ?? '',
    },
    select: clientReviewFields,
  })
  return toDomainClientReview(raw)
}

export const findClientReviewByApplicationId = async (applicationId: string): Promise<DomainClientReview | null> => {
  const raw = await prisma.clientReview.findUnique({
    where: { applicationId },
    select: clientReviewFields,
  })
  return raw ? toDomainClientReview(raw) : null
}
