export interface CategoryInfo {
  id: number
  name: string
}

export interface PostResponseDto {
  id: number
  title: string
  description: string
  startDate: string
  endDate: string
  address: string
  status: string
  createdAt: string
  categories: CategoryInfo[]
}

export interface PostListItemDto {
  id: number
  title: string
  description: string
  address: string
  status: string
  createdAt: string
  categories: CategoryInfo[]
}
