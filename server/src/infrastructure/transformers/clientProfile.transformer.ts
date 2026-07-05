import type { ClientProfileResult } from '../database/clientProfile.database.js'
import type { DomainClientProfile } from '../../domain/types/clientProfile.types.js'

export type DomainClientProfileBase = Omit<
  DomainClientProfile,
  'averageRating' | 'reviewCount' | 'completedJobs'
>

export const toDomainClientProfileBase = (c: ClientProfileResult): DomainClientProfileBase => ({
  id: c.id,
  name: c.name,
  surname: c.surname,
  email: c.email,
  phone: c.phone,
  bio: c.bio,
  role: c.role,
  photo: c.photo,
  createdAt: c.createdAt,
  address: c.address ?? null,
  requiresStartToken: c.requiresStartToken,
})
