import {
  findClientProfileById,
  updateClientProfile as updateClientProfileDb,
  countCompletedPostsByClientId,
} from '../../infrastructure/database/clientProfile.database.js'
import { getClientReviewAggregate } from '../../infrastructure/database/user.database.js'
import { deleteImage } from '../../infrastructure/providers/cloudinary.provider.js'
import type { DomainClientProfile, UpdateClientProfileInput } from '../types/clientProfile.types.js'

const CLOUDINARY_URL_RE = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/

const ratingFromAggregate = (avg: number | null, count: number): number =>
  count > 0 ? Math.round((avg ?? 0) * 10) / 10 : 0

export const getClientProfile = async (id: string): Promise<DomainClientProfile> => {
  const base = await findClientProfileById(id)
  if (!base) {
    throw Object.assign(new Error('Client not found'), { status: 404 })
  }
  const [agg, completedJobs] = await Promise.all([
    getClientReviewAggregate(id),
    countCompletedPostsByClientId(id),
  ])
  return {
    ...base,
    averageRating: ratingFromAggregate(agg._avg.rating, agg._count),
    reviewCount: agg._count,
    completedJobs,
  }
}

export const updateClientProfile = async (
  id: string,
  input: UpdateClientProfileInput,
): Promise<DomainClientProfile> => {
  if (input.photo !== undefined) {
    const current = await findClientProfileById(id)
    if (current?.photo && current.photo !== input.photo && CLOUDINARY_URL_RE.test(current.photo)) {
      await deleteImage(current.photo).catch(() => {})
    }
  }
  await updateClientProfileDb(id, input)
  return getClientProfile(id)
}
