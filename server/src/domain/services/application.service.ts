import {
  findApplicationsByWorker,
  findApplication,
  createApplication,
  findApplicationById,
  updateApplicationStatus,
  deleteApplication,
  findApplicationsByPost,
} from '../../infrastructure/database/application.database.js'
import { findPostById, updatePostStatus, incrementPostFilledCount, decrementPostFilledCount } from '../../infrastructure/database/post.database.js'
import { findUserById } from '../../infrastructure/database/user.database.js'
import { getClientRating } from './user.service.js'
import { createTelegramProvider } from '../../infrastructure/providers/telegram.provider.js'
import { notifyUser } from './notification.service.js'
import { ApplicationStatus } from '../types/applicationStatus.js'
import { PostStatus } from '../types/postStatus.js'
import { PostType } from '../types/postType.js'
import type { CreateApplicationInput, DomainMyApplication, DomainPostApplication } from '../types/application.types.js'
import type { NotificationProvider } from '../types/notification.types.js'

let _provider: NotificationProvider
const getProvider = () => {
  if (!_provider) _provider = createTelegramProvider()
  return _provider
}

export const getMyApplications = async (workerId: string): Promise<DomainMyApplication[]> => {
  const apps = await findApplicationsByWorker(workerId)
  return Promise.all(apps.map(async (app) => {
    const rating = app.clientId ? await getClientRating(app.clientId) : { averageRating: 0, reviewCount: 0 }
    return { ...app, clientRating: rating.averageRating }
  }))
}

export const cancelApplication = async (workerId: string, applicationId: string) => {
  const result = await deleteApplication(workerId, applicationId)
  if (result.count === 0)
    throw Object.assign(new Error('Postulación no encontrada o no cancelable'), { status: 404 })
  return { message: 'Postulación cancelada' }
}

export const applyToPost = async (workerId: string, input: CreateApplicationInput) => {
  const post = await findPostById(input.postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.status !== PostStatus.Active) throw Object.assign(new Error('Esta publicación ya no está disponible'), { status: 400 })

  const existing = await findApplication(workerId, input.postId)
  if (existing) throw Object.assign(new Error('You already applied to this post'), { status: 409 })

  if (input.chargesVisit && (input.visitCost == null || input.visitCost <= 0))
    throw Object.assign(new Error('visitCost must be a positive number when chargesVisit is true'), { status: 400 })

  const created = await createApplication(workerId, input)

  const worker = await findUserById(workerId)
  notifyUser(getProvider(), post.userId, 'application_new', {
    workerName: worker ? `${worker.name}` : 'Alguien',
    postTitle: post.title,
  })

  return { id: created.id, status: created.status, message: 'Application successful' }
}

export const applyToSubcontract = async (workerId: string, input: CreateApplicationInput) => {
  const post = await findPostById(input.postId)
  if (!post) throw Object.assign(new Error('Subcontratación no encontrada'), { status: 404 })
  if (post.type !== PostType.SubContract) throw Object.assign(new Error('Esta publicación no es una subcontratación'), { status: 400 })
  if (post.status !== PostStatus.Active) throw Object.assign(new Error('Esta subcontratación ya no está disponible'), { status: 400 })
  if (post.userId === workerId) throw Object.assign(new Error('No puedes postularte a tu propia subcontratación'), { status: 400 })

  const hasVacancies = post.categories.some((c) => (c.quantity != null ? c.filledCount! < c.quantity : false))
  if (!hasVacancies) throw Object.assign(new Error('No hay vacantes disponibles'), { status: 400 })

  const existing = await findApplication(workerId, input.postId)
  if (existing) throw Object.assign(new Error('Ya te postulaste a esta subcontratación'), { status: 409 })

  if (input.chargesVisit && (input.visitCost == null || input.visitCost <= 0))
    throw Object.assign(new Error('visitCost debe ser un número positivo cuando chargesVisit es true'), { status: 400 })

  const created = await createApplication(workerId, input)

  const worker = await findUserById(workerId)
  notifyUser(getProvider(), post.userId, 'application_new', {
    workerName: worker ? worker.name : 'Alguien',
    postTitle: post.title,
  })

  return { id: created.id, status: created.status, message: 'Postulación a subcontrato exitosa' }
}

export const acceptApplication = async (clientId: string, applicationId: string) => {
  const application = await findApplicationById(applicationId)
  if (!application) throw Object.assign(new Error('Application not found'), { status: 404 })
  if (application.post.userId !== clientId) throw Object.assign(new Error('Forbidden'), { status: 403 })
  if (application.status !== ApplicationStatus.Pending) throw Object.assign(new Error('Application is not pending'), { status: 400 })
  if (application.post.status !== PostStatus.Active) throw Object.assign(new Error('Post is not active'), { status: 400 })

  const accepted = await updateApplicationStatus(applicationId, ApplicationStatus.Accepted)
  await updatePostStatus(application.postId, PostStatus.InProgress)

  if (application.post.type === PostType.SubContract) {
    await incrementPostFilledCount(application.postId)
  }

  notifyUser(getProvider(), application.workerId, 'application_accepted', {
    postTitle: application.post.title,
  })

  return { id: accepted.id, status: accepted.status }
}

export const rejectApplication = async (clientId: string, applicationId: string) => {
  const application = await findApplicationById(applicationId)
  if (!application) throw Object.assign(new Error('Application not found'), { status: 404 })
  if (application.post.userId !== clientId) throw Object.assign(new Error('Forbidden'), { status: 403 })
  if (application.status !== ApplicationStatus.Pending) throw Object.assign(new Error('Application is not pending'), { status: 400 })

  const rejected = await updateApplicationStatus(applicationId, ApplicationStatus.Rejected)

  notifyUser(getProvider(), application.workerId, 'application_rejected', {
    postTitle: application.post.title,
  })

  return { id: rejected.id, status: rejected.status }
}

export const dismissWorker = async (clientId: string, applicationId: string) => {
  const application = await findApplicationById(applicationId)
  if (!application) throw Object.assign(new Error('Application not found'), { status: 404 })
  if (application.post.userId !== clientId) throw Object.assign(new Error('Forbidden'), { status: 403 })
  if (application.status !== ApplicationStatus.Accepted) throw Object.assign(new Error('Application is not accepted'), { status: 400 })
  if (application.post.status !== PostStatus.InProgress) throw Object.assign(new Error('Post is not in progress'), { status: 400 })

  const dismissed = await updateApplicationStatus(applicationId, ApplicationStatus.Dismissed)
  // Reopen the post so the client can hire a different worker; other pending applicants are kept.
  await updatePostStatus(application.postId, PostStatus.Active)

  if (application.post.type === PostType.SubContract) {
    await decrementPostFilledCount(application.postId)
  }

  notifyUser(getProvider(), application.workerId, 'worker_dismissed', {
    postTitle: application.post.title,
  })

  return { id: dismissed.id, status: dismissed.status }
}

export const getPostApplications = (clientId: string, postId: string): Promise<DomainPostApplication[]> =>
  findPostById(postId).then((post) => {
    if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
    if (post.userId !== clientId) throw Object.assign(new Error('Forbidden'), { status: 403 })
    return findApplicationsByPost(postId)
  })
