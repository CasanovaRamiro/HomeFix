import { PostType } from '../../domain/types/postType.js'

export const availablePostWhere = (category?: string, now = new Date()) => ({
  status: 'Active',
  type: { in: [PostType.Post, PostType.Emergency] },
  OR: [
    { type: PostType.Post, isEmergency: false },
    { emergencyExpiresAt: { gt: now } },
  ],
  ...(category?.trim()
    ? {
        categories: {
          some: {
            category: {
              name: category.trim(),
            },
          },
        },
      }
    : {}),
})
