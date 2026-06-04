export interface DomainUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: Date
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  phone?: string
  surname?: string
  nationalId?: string
  role?: string
}
