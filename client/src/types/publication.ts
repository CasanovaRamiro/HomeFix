export interface Publication {
  id: number
  description: string
  date: string
  status: string
  fromStartJob: string
  untilFinishJob: string
  typePublication: string
  userId: number
  photo: string
}

export interface TrabajoView {
  id: number
  titulo: string
  descripcion: string
  categoria: string
  fechaPublicacion: string
  fechaServicio: string
  photo: string
}
