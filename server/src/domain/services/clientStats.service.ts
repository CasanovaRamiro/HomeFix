import type { ClientStats } from '../types/clientStats.types.js'
import { countClientPosts, findCompletedPostsWithApps } from '../../infrastructure/database/clientStats.database.js'
import { PostStatus } from '../types/postStatus.js'
import { getClientRating } from './user.service.js'

export const getClientStats = async (userId: string): Promise<ClientStats> => {
  const [completedPosts, cancelledPosts, rating, completedWithApps] = await Promise.all([
    countClientPosts(userId, PostStatus.Completed),
    countClientPosts(userId, PostStatus.Cancelled),
    getClientRating(userId),
    findCompletedPostsWithApps(userId),
  ])

  const unreviewedJobs = completedWithApps.filter(
    (p) => p.applications.some((a) => !a.review)
  ).length

  return { completedPosts, cancelledPosts, unreviewedJobs, clientRating: rating }
}
