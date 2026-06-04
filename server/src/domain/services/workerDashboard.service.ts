import {
  findWorkerProfile,
  countWorkerReviews,
  countWorkerApplications,
  countNewJobsForWorker,
  countCompletedJobs,
} from '../../infrastructure/database/workerDashboard.database.js'

export const getWorkerDashboard = async (workerId: string) => {
  const profile = await findWorkerProfile(workerId)
  if (!profile) {
    throw Object.assign(new Error('Worker not found'), { status: 404 })
  }

  const [reviewStats, applicationGroups, completedJobs] = await Promise.all([
    countWorkerReviews(workerId),
    countWorkerApplications(workerId),
    countCompletedJobs(workerId),
  ])

  const categoryIds = profile.categories.map((c) => c.category.id)
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

  const location = profile.address
    ? `${profile.address.city}, ${profile.address.state}`
    : null

  return {
    profile: {
      id: profile.id,
      name: profile.name,
      surname: profile.surname,
      email: profile.email,
      phone: profile.phone,
      bio: profile.bio,
      createdAt: profile.createdAt,
      location,
      categories: profile.categories.map((c) => c.category),
    },
    stats: {
      totalJobs: completedJobs,
      reviewCount: reviewStats.count,
      avgRating: Math.round(reviewStats.avgRating * 10) / 10,
      newJobs,
      pendingApplications,
      upcomingAppointments: acceptedApplications,
      responseRate,
    },
  }
}
