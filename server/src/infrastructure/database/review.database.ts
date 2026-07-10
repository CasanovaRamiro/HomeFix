import prisma from '../../lib/prisma.js'
import { Prisma } from '@prisma/client'
import { toDomainWorkerReview } from '../transformers/worker.transformer.js'
import { toDomainClientReview } from '../transformers/clientReview.transformer.js'
import type { DomainWorkerReview } from '../../domain/types/worker.types.js'
import type { DomainClientReview } from '../../domain/types/review.types.js'

const reviewFields = {
  id: true,
  workerId: true,
  rating: true,
  description: true,
  mediaUrls: true,
  createdAt: true,
  reviewer: {
    select: { id: true, name: true },
  },
  application: {
    select: {
      postId: true,
      post: { select: { id: true, title: true } },
    },
  },
} satisfies Prisma.WorkerReviewSelect

export type ReviewResult = Prisma.WorkerReviewGetPayload<{ select: typeof reviewFields }>

export interface CreateReviewData {
  applicationId: string
  reviewerId: string
  workerId: string
  rating: number
  description?: string
  mediaUrls?: string
}

export const createReview = async (data: CreateReviewData): Promise<DomainWorkerReview> => {
  const raw = await prisma.workerReview.create({
    data: {
      applicationId: data.applicationId,
      reviewerId: data.reviewerId,
      workerId: data.workerId,
      rating: data.rating,
      description: data.description ?? '',
      mediaUrls: data.mediaUrls ?? null,
    },
    select: reviewFields,
  })
  return toDomainWorkerReview(raw)
}

export const findWorkerReviewByApplicationId = async (applicationId: string): Promise<DomainWorkerReview | null> => {
  const raw = await prisma.workerReview.findUnique({
    where: { applicationId },
    select: reviewFields,
  })
  return raw ? toDomainWorkerReview(raw) : null
}

export const findWorkerReviewById = async (id: string): Promise<DomainWorkerReview | null> => {
  const raw = await prisma.workerReview.findUnique({
    where: { id },
    select: reviewFields,
  })
  return raw ? toDomainWorkerReview(raw) : null
}

export const findReviewsByWorkerId = async (workerId: string): Promise<DomainWorkerReview[]> => {
  const raw = await prisma.workerReview.findMany({
    where: { workerId },
    select: reviewFields,
    orderBy: { createdAt: 'desc' },
  })
  return raw.map(toDomainWorkerReview)
}

const clientReviewFields = {
  id: true,
  clientId: true,
  rating: true,
  description: true,
  createdAt: true,
  reviewer: {
    select: { id: true, name: true },
  },
  client: {
    select: { id: true, name: true },
  },
} satisfies Prisma.ClientReviewSelect

export type ClientReviewResult = Prisma.ClientReviewGetPayload<{ select: typeof clientReviewFields }>

export interface CreateClientReviewData {
  applicationId: string
  reviewerId: string
  clientId: string
  rating: number
  description?: string
}

export const createClientReview = async (data: CreateClientReviewData): Promise<DomainClientReview> => {
  const raw = await prisma.clientReview.create({
    data: {
      applicationId: data.applicationId,
      reviewerId: data.reviewerId,
      clientId: data.clientId,
      rating: data.rating,
      description: data.description ?? '',
    },
    select: clientReviewFields,
  })
  return toDomainClientReview(raw)
}

export const findClientReviewByApplicationId = async (applicationId: string): Promise<DomainClientReview | null> => {
  const raw = await prisma.clientReview.findUnique({
    where: { applicationId },
    select: clientReviewFields,
  })
  return raw ? toDomainClientReview(raw) : null
}

export const findClientReviewById = async (id: string): Promise<DomainClientReview | null> => {
  const raw = await prisma.clientReview.findUnique({
    where: { id },
    select: clientReviewFields,
  })
  return raw ? toDomainClientReview(raw) : null
}
