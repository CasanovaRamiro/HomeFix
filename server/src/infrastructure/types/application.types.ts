export interface PrismaApplicationWithPost {
  id: string
  postId: string
  categoryId: string | null
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
    endDate: Date
    user: { id: string; name: string; surname: string; phone: string | null }
    categories: { category: { name: string } }[]
  }
  category: { id: string; category: { name: string } } | null
  clientReview: { id: string } | null
}

export interface PrismaApplicationWithWorker {
  id: string
  postId: string
  categoryId: string | null
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
  category: { id: string; category: { name: string } } | null
  review: { id: string } | null
}
