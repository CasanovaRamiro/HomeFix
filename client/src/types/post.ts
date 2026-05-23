export interface PostCategoryDTO {
  category: {
    id: number
    name: string
  }
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
  categories: PostCategoryDTO[]
}

export type Post = PostDTO
export type PostCategory = PostCategoryDTO

export interface TrabajoView {
  id: number
  titulo: string
  descripcion: string
  categoria: string
  fechaPublicacion: string
  fechaServicio: string
  photo: string
}
