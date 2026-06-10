export enum PostStatus {
  Active = 'Active',
  InProgress = 'In progress',
  Paused = 'Paused',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

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
  isEmergency: boolean
  emergencyExpiresAt: string | null
  categories: PostCategoryDTO[]
  user: {
    id: string
    name: string
    surname: string
  }
  clientRating: number
}

export type Post = PostDTO
export type PostCategory = PostCategoryDTO

export interface TrabajoView {
  id: string
  titulo: string
  descripcion: string
  categoria: string
  fechaPublicacion: string
  fechaServicio: string
  createdAt: string
  startDate: string
  photo: string
  clientName: string
  clientSurname: string
  clientRating: number
  address: string
  isEmergency: boolean
}
