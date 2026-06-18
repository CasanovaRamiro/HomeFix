export enum UserRole {
  Worker = 'worker',
  Client = 'client',
}

export interface StoredUser {
  id: string
  name: string
  email: string
  role: UserRole
  photo?: string | null
}
