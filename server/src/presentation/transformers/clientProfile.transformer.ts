import type { DomainClientProfile } from '../../domain/types/clientProfile.types.js'
import type { ClientProfileDTO } from '../types/clientProfile.types.js'

export const toClientProfileDTO = (
  profile: DomainClientProfile,
  options: { includeContact: boolean },
): ClientProfileDTO => {
  const dto: ClientProfileDTO = {
    id: profile.id,
    name: profile.name,
    surname: profile.surname,
    bio: profile.bio,
    role: profile.role,
    photo: profile.photo,
    createdAt: profile.createdAt.toISOString(),
    averageRating: profile.averageRating,
    reviewCount: profile.reviewCount,
    completedJobs: profile.completedJobs,
  }
  if (options.includeContact) {
    dto.email = profile.email
    dto.phone = profile.phone
    dto.requiresStartToken = profile.requiresStartToken
  }
  dto.address = profile.address
  return dto
}
