import {
  findWorkerProfile,
  countWorkerReviews,
  countWorkerApplications,
  countNewJobsForWorker,
  countCompletedJobs,
} from '../data/workerDashboard.data.js'

export const getWorkerDashboard = async (workerId: string) => {
  const profile = await findWorkerProfile(workerId)
  if (!profile) {
    const err = Object.assign(new Error('Worker not found'), { status: 404 })
    throw err
  }

  const [reviewStats, applicationGroups, completedJobs] = await Promise.all([
    countWorkerReviews(workerId),
    countWorkerApplications(workerId),
    countCompletedJobs(workerId),
  ])

  const categoryIds = profile.categories.map((c) => c.category.id)
  const newJobs = await countNewJobsForWorker(categoryIds)

  // Parse application counts by status
  const appCounts: Record<string, number> = {}
  for (const group of applicationGroups) {
    appCounts[group.status] = group._count
  }

  const pendingApplications = appCounts['Pending'] ?? 0
  const acceptedApplications = appCounts['Accepted'] ?? 0
  const totalApplications = Object.values(appCounts).reduce((a, b) => a + b, 0)

  // Response rate: percentage of non-pending applications (answered)
  const answered = totalApplications - pendingApplications
  const responseRate = totalApplications > 0 ? Math.round((answered / totalApplications) * 100) : 100

  // Build location string from address
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
