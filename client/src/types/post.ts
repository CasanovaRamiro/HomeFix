export interface PostCategoryDTO {
  category: {
    id: string
    name: string
  }
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
  photo: string
}
