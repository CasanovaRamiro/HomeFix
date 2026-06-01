export interface PostCategoryDTO {
  id: string
  name: string
}

export interface UserPostDTO {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  address: string
  startDate: string
  endDate: string
  categories: PostCategoryDTO[]
  worker: { id: string; name: string } | null
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
  }
}
