import type { DomainUserRating } from './user.types.js'

export interface ClientStats {
  completedPosts: number
  cancelledPosts: number
  unreviewedJobs: number
  clientRating: DomainUserRating
}
