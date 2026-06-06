import type { DomainMyApplication } from '../../domain/types/application.types.js'

export const toMyApplicationDTO = (app: DomainMyApplication) => ({
  id: app.id,
  postId: app.postId,
  title: app.title,
  client: app.client,
  clientId: app.clientId,
  location: app.location,
  appliedAt: app.appliedAt.toISOString().split('T')[0],
  serviceDate: app.serviceDate.toISOString().split('T')[0],
  status: app.status,
  category: app.category,
  hasReview: app.hasReview,
})
