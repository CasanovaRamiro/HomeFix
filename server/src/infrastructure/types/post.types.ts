import type { PostType } from '../../domain/types/postType.js'

export interface PrismaPostFull {
  id: string
  userId: string
  type: PostType
  parentPostId?: string
  subcontractGroupId?: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  address: string
  status: string
  createdAt: Date
  images: { url: string }[]
  latitude: number | null
  longitude: number | null
  isEmergency: boolean
  emergencyExpiresAt: Date | null
  categories: {
    category: { id: string; name: string }
    quantity: number
    filledCount: number
    roleDescription: string | null
  }[]
  user: { id: string; name: string; surname: string }
}
