export interface PrismaApplicationWithPost {
  id: string
  postId: string
  workerId: string
  status: string
  createdAt: Date
  post: {
    title: string
    address: string
    startDate: Date
    user: { id: string; name: string; surname: string }
    categories: { category: { name: string } }[]
  }
}

export interface PrismaApplicationWithWorker {
  id: string
  postId: string
  status: string
  createdAt: Date
  worker: {
    id: string
    name: string
    surname: string
    categories: { category: { name: string } }[]
    address: { city: string; state: string } | null
    reviewsReceived: { rating: number }[]
    applications: { id: string }[]
  }
}
