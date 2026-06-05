import prisma from '../../lib/prisma.js'
import { Prisma } from '@prisma/client'
import { toDomainWorkerReview } from '../transformers/worker.transformer.js'
import type { DomainWorkerReview } from '../../domain/types/worker.types.js'

const reviewFields = {
  id: true,
  rating: true,
  description: true,
  mediaUrls: true,
  createdAt: true,
  reviewer: {
    select: { id: true, name: true },
  },
  application: {
    select: {
      postId: true,
      post: { select: { id: true, title: true } },
    },
  },
} satisfies Prisma.WorkerReviewSelect

export type ReviewResult = Prisma.WorkerReviewGetPayload<{ select: typeof reviewFields }>

export interface CreateReviewData {
  applicationId: string
  reviewerId: string
  workerId: string
  rating: number
  description?: string
  mediaUrls?: string
}

export const createReview = async (data: CreateReviewData): Promise<DomainWorkerReview> => {
  const raw = await prisma.workerReview.create({
    data: {
      applicationId: data.applicationId,
      reviewerId: data.reviewerId,
      workerId: data.workerId,
      rating: data.rating,
      description: data.description ?? '',
      mediaUrls: data.mediaUrls ?? null,
    },
    select: reviewFields,
  })
  return toDomainWorkerReview(raw)
}

export const findReviewsByWorkerId = async (workerId: string): Promise<DomainWorkerReview[]> => {
  const raw = await prisma.workerReview.findMany({
    where: { workerId },
    select: reviewFields,
    orderBy: { createdAt: 'desc' },
  })
  return raw.map(toDomainWorkerReview)
}
