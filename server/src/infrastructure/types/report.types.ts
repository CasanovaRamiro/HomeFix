import { Prisma } from '@prisma/client'

export const reportSelect = {
  id: true,
  reporterId: true,
  reportedUserId: true,
  reason: true,
  description: true,
  applicationId: true,
  reviewId: true,
  targetType: true,
  createdAt: true,
} satisfies Prisma.ReportSelect

export type ReportResult = Prisma.ReportGetPayload<{ select: typeof reportSelect }>
