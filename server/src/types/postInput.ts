export interface PostInput {
  id: number
  userId: number
  description: string
  startDate: Date
  endDate: Date
  address: string
  categoryIds: number[]
  title: string
}