import { findApplicationsByWorker, findApplication, createApplication, findApplicationById, updateApplicationStatus, rejectOtherApplications } from "../data/application.data.js"
import { findPostById, updatePostStatus } from "../data/post.data.js"

export const getMyApplications = async (workerId: string) => {
  const applications = await findApplicationsByWorker(workerId)

  return applications.map((a) => ({
    id: a.id,
    postId: a.postId,
    title: a.post.title,
    client: `${a.post.user.name} ${a.post.user.surname}`.trim(),
    location: a.post.address,
    appliedAt: a.createdAt.toISOString().split('T')[0],
    serviceDate: a.post.startDate.toISOString().split('T')[0],
    status: a.status,
  }))
}

export const applyToPost = async (workerId: string, postId: string) => {
  const post = await findPostById(postId)
  if (!post) throw Object.assign(new Error("Post not found"), { status: 404 })
  if (post.status !== "Active") throw Object.assign(new Error("This post is no longer available"), { status: 400 })

  const existing = await findApplication(workerId, postId)
  if (existing) throw Object.assign(new Error("You already applied to this post"), { status: 409 })

  const created = await createApplication(workerId, postId)
  return { id: created.id, status: created.status, message: "Application successful" }
}

export const acceptApplication = async (clientId: string, applicationId: string) => {
  const application = await findApplicationById(applicationId)
  if (!application) throw Object.assign(new Error("Application not found"), { status: 404 })
  if (application.post.userId !== clientId) throw Object.assign(new Error("Forbidden"), { status: 403 })
  if (application.status !== "Pending") throw Object.assign(new Error("Application is not pending"), { status: 400 })
  if (application.post.status !== "Active") throw Object.assign(new Error("Post is not active"), { status: 400 })

  const accepted = await updateApplicationStatus(applicationId, "Accepted")
  await updatePostStatus(application.postId, "In progress")
  await rejectOtherApplications(application.postId, applicationId)

  return { id: accepted.id, status: accepted.status }
}
