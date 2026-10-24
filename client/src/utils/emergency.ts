export interface EmergencyFields {
  isEmergency?: boolean
  type?: string
  emergencyExpiresAt?: string | null
}

export const isEmergencyPost = (post: EmergencyFields): boolean =>
  post.isEmergency === true || post.type === 'emergency'

export const isExpiredEmergency = (
  post: EmergencyFields,
  now: Date = new Date(),
): boolean => {
  if (!isEmergencyPost(post)) return false
  if (post.emergencyExpiresAt === null || post.emergencyExpiresAt === undefined) return true

  const expiresAt = new Date(post.emergencyExpiresAt).getTime()
  return !Number.isFinite(expiresAt) || expiresAt <= now.getTime()
}

export const getEmergencyTimeLeft = (
  expiresAt: string | null | undefined,
  now: Date = new Date(),
): string | null => {
  if (expiresAt === null || expiresAt === undefined) return null

  const diff = new Date(expiresAt).getTime() - now.getTime()
  if (!Number.isFinite(diff) || diff <= 0) return null

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${mins}m restantes`
  return `${mins}m restantes`
}
