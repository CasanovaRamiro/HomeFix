import type { DomainMyApplication, DomainStartToken } from '../../domain/types/application.types.js'
import type { StartTokenDTO, StartTokenValidatedDTO } from '../types/application.types.js'

export const toMyApplicationDTO = (app: DomainMyApplication) => ({
  id: app.id,
  postId: app.postId,
  title: app.title,
  client: app.client,
  clientId: app.clientId,
  location: app.location,
  appliedAt: app.appliedAt.toISOString().split('T')[0],
  serviceDate: app.serviceDate.toISOString().split('T')[0],
  endDate: app.endDate.toISOString().split('T')[0],
  status: app.status,
  isBidding: app.isBidding,
  category: app.category,
  categoryId: app.categoryId,
  hasReview: app.hasReview,
  clientReview: app.clientReview ? { ...app.clientReview, createdAt: app.clientReview.createdAt.toISOString() } : null,
  clientPhone: app.clientPhone,
  clientRating: app.clientRating,
  message: app.message,
  availableDays: app.availableDays,
  availableTimeFrom: app.availableTimeFrom,
  availableTimeTo: app.availableTimeTo,
  chargesVisit: app.chargesVisit,
  visitCost: app.visitCost,
  requiresStartToken: app.requiresStartToken,
  startToken: app.startToken,
  startTokenExpiresAt: app.startTokenExpiresAt ? app.startTokenExpiresAt.toISOString() : null,
  tokenValidatedAt: app.tokenValidatedAt ? app.tokenValidatedAt.toISOString() : null,
})

export const toStartTokenDTO = (t: DomainStartToken): StartTokenDTO => ({
  token: t.token,
  expiresAt: t.expiresAt.toISOString(),
})

export const toStartTokenValidatedDTO = (validatedAt: Date): StartTokenValidatedDTO => ({
  validatedAt: validatedAt.toISOString(),
})
