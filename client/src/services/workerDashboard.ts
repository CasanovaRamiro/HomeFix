import api from './api'

export interface DashboardProfile {
  id: string
  name: string
  surname: string
  email: string
  phone: string | null
  bio: string | null
  photo: string | null
  createdAt: string
  location: string | null
  categories: { id: string; name: string }[]
  emergenciesEnabled: boolean
}

export interface DashboardStats {
  totalJobs: number
  reviewCount: number
  avgRating: number
  newJobs: number
  pendingApplications: number
  upcomingAppointments: number
  responseRate: number
}

export interface DashboardData {
  profile: DashboardProfile
  stats: DashboardStats
}

export const fetchWorkerDashboard = () =>
  api.get<DashboardData>('/worker-dashboard')
