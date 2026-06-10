export interface PrismaPostFull {
  id: string
  userId: string
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
  categories: { category: { id: string; name: string } }[]
  user: { id: string; name: string; surname: string }
}
