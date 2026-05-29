export enum UserRole {
  Worker = 'trabajador',
  Client = 'cliente',
}

export interface StoredUser {
  id: string
  name: string
  email: string
  role: UserRole
}
