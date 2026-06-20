import {
  findWorkerProfile,
  countWorkerApplications,
  countNewJobsForWorker,
  countCompletedJobs,
} from '../../infrastructure/database/workerDashboard.database.js'
import { getUserRating } from './user.service.js'

export const getWorkerDashboard = async (workerId: string) => {
  const profile = await findWorkerProfile(workerId)
  if (!profile) {
    throw Object.assign(new Error('Worker not found'), { status: 404 })
  }

  const [reviewStats, applicationGroups, completedJobs] = await Promise.all([
    getUserRating(workerId),
    countWorkerApplications(workerId),
    countCompletedJobs(workerId),
  ])

  const categoryIds = profile.categories.map((c) => c.id)
  const newJobs = await countNewJobsForWorker(categoryIds)

  const appCounts: Record<string, number> = {}
  for (const group of applicationGroups) {
    appCounts[group.status] = group._count
  }

  const pendingApplications = appCounts['Pending'] ?? 0
  const acceptedApplications = appCounts['Accepted'] ?? 0
  const totalApplications = Object.values(appCounts).reduce((a, b) => a + b, 0)

  const answered = totalApplications - pendingApplications
  const responseRate = totalApplications > 0 ? Math.round((answered / totalApplications) * 100) : 100

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      surname: profile.surname,
      email: profile.email,
      phone: profile.phone,
      bio: profile.bio,
      photo: profile.photo,
      createdAt: profile.createdAt,
       location: profile.location,
       categories: profile.categories,
       emergenciesEnabled: profile.emergenciesEnabled,
     },

    stats: {
      totalJobs: completedJobs,
      reviewCount: reviewStats.reviewCount,
      avgRating: reviewStats.averageRating,
      newJobs,
      pendingApplications,
      upcomingAppointments: acceptedApplications,
      responseRate,
    },
  }
}
