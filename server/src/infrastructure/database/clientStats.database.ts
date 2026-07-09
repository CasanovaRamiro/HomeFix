import prisma from '../../lib/prisma.js'
import { PostStatus } from '../../domain/types/postStatus.js'
import { ApplicationStatus } from '../../domain/types/applicationStatus.js'

export const countClientPosts = (userId: string, status: PostStatus) =>
  prisma.post.count({ where: { userId, status } })

export const findCompletedPostsWithApps = (userId: string) =>
  prisma.post.findMany({
    where: { userId, status: PostStatus.Completed },
    include: {
      applications: {
        where: { status: { in: [ApplicationStatus.Accepted, ApplicationStatus.Completed] } },
        include: { review: { select: { id: true } } },
      },
    },
  })
