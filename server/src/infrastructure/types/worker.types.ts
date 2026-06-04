import { Prisma } from '@prisma/client'

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

export type WorkerResult = Prisma.UserGetPayload<{ select: typeof workerFields }>

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
