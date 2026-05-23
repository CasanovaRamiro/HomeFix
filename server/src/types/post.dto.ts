export interface PostCategoryDTO {
  id: number
  name: string
}

export interface PostDTO {
  id: number
  userId: number
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
  status: string
  createdAt: string
  image: string
  categories: {
    category: PostCategoryDTO
  }[]
}
