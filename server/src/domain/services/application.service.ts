import {
  findApplicationsByWorker,
  findApplication,
  createApplication,
  findApplicationById,
  updateApplicationStatus,
  deleteApplication,
  findApplicationsByPost,
} from '../../infrastructure/database/application.database.js'
import { findPostById, updatePostStatus } from '../../infrastructure/database/post.database.js'
import type { DomainMyApplication, DomainPostApplication } from '../types/application.types.js'

export const getMyApplications = (workerId: string): Promise<DomainMyApplication[]> =>
  findApplicationsByWorker(workerId)

export const cancelApplication = async (workerId: string, applicationId: string) => {
  const result = await deleteApplication(workerId, applicationId)
  if (result.count === 0)
    throw Object.assign(new Error('Postulación no encontrada o no cancelable'), { status: 404 })
  return { message: 'Postulación cancelada' }
}

export const applyToPost = async (workerId: string, postId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
  if (post.status !== 'Active') throw Object.assign(new Error('This post is no longer available'), { status: 400 })

  const existing = await findApplication(workerId, postId)
  if (existing) throw Object.assign(new Error('You already applied to this post'), { status: 409 })

  const created = await createApplication(workerId, postId)
  return { id: created.id, status: created.status, message: 'Application successful' }
}

export const acceptApplication = async (clientId: string, applicationId: string) => {
  const application = await findApplicationById(applicationId)
  if (!application) throw Object.assign(new Error('Application not found'), { status: 404 })
  if (application.post.userId !== clientId) throw Object.assign(new Error('Forbidden'), { status: 403 })
  if (application.status !== 'Pending') throw Object.assign(new Error('Application is not pending'), { status: 400 })
  if (application.post.status !== 'Active') throw Object.assign(new Error('Post is not active'), { status: 400 })

  const accepted = await updateApplicationStatus(applicationId, 'Accepted')
  await updatePostStatus(application.postId, 'In progress')

  return { id: accepted.id, status: accepted.status }
}

export const rejectApplication = async (clientId: string, applicationId: string) => {
  const application = await findApplicationById(applicationId)
  if (!application) throw Object.assign(new Error('Application not found'), { status: 404 })
  if (application.post.userId !== clientId) throw Object.assign(new Error('Forbidden'), { status: 403 })
  if (application.status !== 'Pending') throw Object.assign(new Error('Application is not pending'), { status: 400 })

  const rejected = await updateApplicationStatus(applicationId, 'Rejected')
  return { id: rejected.id, status: rejected.status }
}

export const getPostApplications = (clientId: string, postId: string): Promise<DomainPostApplication[]> =>
  findPostById(postId).then((post) => {
    if (!post) throw Object.assign(new Error('Post not found'), { status: 404 })
    if (post.userId !== clientId) throw Object.assign(new Error('Forbidden'), { status: 403 })
    return findApplicationsByPost(postId)
  })
