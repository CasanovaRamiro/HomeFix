export interface PrismaApplicationWithPost {
  id: string
  postId: string
  workerId: string
  status: string
  createdAt: Date
  message: string | null
  availableDays: string | null
  availableTimeFrom: string | null
  availableTimeTo: string | null
  chargesVisit: boolean
  visitCost: number | null
  post: {
    title: string
    address: string
    startDate: Date
    user: { id: string; name: string; surname: string }
    categories: { category: { name: string } }[]
  }
  clientReview: { id: string } | null
}

export interface PrismaApplicationWithWorker {
  id: string
  postId: string
  status: string
  createdAt: Date
  message: string | null
  availableDays: string | null
  availableTimeFrom: string | null
  availableTimeTo: string | null
  chargesVisit: boolean
  visitCost: number | null
  worker: {
    id: string
    name: string
    surname: string
    photo: string | null
    phone: string | null
    categories: { category: { name: string } }[]
    address: { city: string; state: string } | null
    reviewsReceived: { rating: number }[]
    applications: { id: string }[]
  }
}
