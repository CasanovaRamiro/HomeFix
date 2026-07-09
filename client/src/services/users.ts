import api from './api'

export interface ClientReview {
  id: string
  rating: number
  description: string | null
  createdAt: string
  reviewer: { id: string; name: string }
  client: { id: string; name: string }
}

export const getClientReviews = (id: string): Promise<ClientReview[]> =>
  api.get<ClientReview[]>(`/users/${id}/reviews`, { params: { as: 'client' } }).then((r) => r.data)

export const updateUserEmergencyNotifications = (id: string, enabled: boolean) =>
  api.patch(`/users/${id}/emergencies`, { enabled })

export const updateUserRequiresStartToken = (id: string, enabled: boolean) =>
  api.patch(`/users/${id}/start-token-setting`, { enabled })
