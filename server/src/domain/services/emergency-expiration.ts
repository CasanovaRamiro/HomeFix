import { PostType } from '../types/postType.js'

export const isExpiredEmergency = (
  post: { type?: string; isEmergency?: boolean; emergencyExpiresAt?: Date | null },
  now = new Date(),
): boolean =>
  (post.isEmergency === true || post.type === PostType.Emergency) &&
  (!post.emergencyExpiresAt || post.emergencyExpiresAt <= now)
