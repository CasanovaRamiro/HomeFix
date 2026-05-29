export enum UserRole {
  Trabajador = 'trabajador',
  Cliente = 'cliente',
}

export interface StoredUser {
  id: string
  name: string
  email: string
  role: UserRole
}
