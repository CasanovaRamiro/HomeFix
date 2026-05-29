export interface PostCategoryDTO {
  id: string
  name: string
}

export interface PostDTO {
  id: string
  userId: string
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
  status: string
  createdAt: string
  images: { url: string }[]
  latitude: number | null
  longitude: number | null
  categories: PostCategoryDTO[]
  user: {
    id: string
    name: string
    surname: string
  }
}
