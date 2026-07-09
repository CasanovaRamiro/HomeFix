import api from './api'

export interface ClientProfile {
  id: string
  name: string
  surname: string
  bio: string | null
  role: string
  photo: string | null
  createdAt: string
  averageRating: number
  reviewCount: number
  completedJobs: number
  // Only present when the requester is the owner.
  email?: string
  phone?: string | null
  address?: { street: string; number: string; city: string; state: string } | null
  requiresStartToken?: boolean
}

export interface ClientProfileUpdateData {
  name?: string
  surname?: string
  phone?: string | null
  bio?: string | null
  photo?: string | null
}

export const getClientProfile = (id: string): Promise<ClientProfile> =>
  api.get<ClientProfile>(`/client-profiles/${id}`).then((r) => r.data)

export const updateClientProfile = (id: string, data: ClientProfileUpdateData): Promise<ClientProfile> =>
  api.patch<ClientProfile>(`/client-profiles/${id}`, data).then((r) => r.data)
