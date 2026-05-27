import prisma from '../lib/prisma.js'
import { Prisma } from '@prisma/client'

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

type ReviewResult = Prisma.WorkerReviewGetPayload<{ select: typeof reviewFields }>

export const findReviewsByWorkerId = (workerId: string): Promise<ReviewResult[]> =>
  prisma.workerReview.findMany({
    where: { workerId },
    select: reviewFields,
    orderBy: { createdAt: 'desc' },
  })
