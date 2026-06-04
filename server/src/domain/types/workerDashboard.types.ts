export interface DomainWorkerProfile {
  id: string
  name: string
  surname: string | null
  email: string
  phone: string | null
  bio: string | null
  createdAt: Date
  location: string | null
  categories: { id: string; name: string }[]
}

export interface DomainWorkerStats {
  totalJobs: number
  reviewCount: number
  avgRating: number
  newJobs: number
  pendingApplications: number
  upcomingAppointments: number
  responseRate: number
}

export interface DomainWorkerDashboard {
  profile: DomainWorkerProfile
  stats: DomainWorkerStats
}
