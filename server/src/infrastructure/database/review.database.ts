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
  jobApplication: {
    select: {
      postId: true,
      post: { select: { id: true, title: true } },
    },
  },
} satisfies Prisma.WorkerReviewSelect

export type ReviewResult = Prisma.WorkerReviewGetPayload<{ select: typeof reviewFields }>

export const findReviewsByWorkerId = async (workerId: string): Promise<DomainWorkerReview[]> => {
  const raw = await prisma.workerReview.findMany({
    where: { workerId },
    select: reviewFields,
    orderBy: { createdAt: 'desc' },
  })
  return raw.map(toDomainWorkerReview)
}
