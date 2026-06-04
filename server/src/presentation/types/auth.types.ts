export interface RegisterInput {
  name?: string
  lastName?: string
  email?: string
  password?: string
  phone?: string
  address?: string
  nationalId?: string
}

export interface LoginInput {
  email?: string
  password?: string
}
