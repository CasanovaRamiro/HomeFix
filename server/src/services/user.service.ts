import { findAll } from '../data/user.data.js'
import type { UserResponseDto } from '../types/dto/user.dto.js'

const toUserResponse = (user: {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: Date
}): UserResponseDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
})

export const listUsers = async (): Promise<UserResponseDto[]> => {
  const users = await findAll()
  return users.map(toUserResponse)
}
