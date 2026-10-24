import { isEmergencyPost, isExpiredEmergency, type EmergencyFields } from './emergency'

interface DashboardPost extends EmergencyFields {
  status: string
}

const ACTIVE_STATUSES = new Set<string>([
  'Active',
  'In progress',
  'Paused',
])

export const isAvailablePublication = <T extends DashboardPost>(
  post: T,
  now: Date = new Date(),
): boolean => ACTIVE_STATUSES.has(post.status) && !isExpiredEmergency(post, now)

export const isCurrentEmergency = <T extends DashboardPost>(
  post: T,
  now: Date = new Date(),
): boolean =>
  isEmergencyPost(post) &&
  post.status !== 'Completed' &&
  post.status !== 'Cancelled' &&
  !isExpiredEmergency(post, now)

export const countActivePublications = <T extends DashboardPost>(
  posts: T[],
  now: Date = new Date(),
): number => posts.filter((post) => isAvailablePublication(post, now)).length

export const countCurrentEmergencies = <T extends DashboardPost>(
  posts: T[],
  now: Date = new Date(),
): number => posts.filter((post) => isCurrentEmergency(post, now)).length

export const filterCurrentEmergencies = <T extends DashboardPost>(
  posts: T[],
  now: Date = new Date(),
): T[] => posts.filter((post) => isCurrentEmergency(post, now))
