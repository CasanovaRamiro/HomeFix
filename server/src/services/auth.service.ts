import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { findByEmail, createUser } from '../data/user.data.js'
import type { AuthResponseDto } from '../types/dto/auth.dto.js'
import type { UserResponseDto } from '../types/dto/user.dto.js'

interface RegisterInput {
  name: string
  email: string
  password: string
  phone?: string
}

interface LoginInput {
  email: string
  password: string
}

const signToken = (id: number): string =>
  jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '7d' })

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

export const register = async ({ name, email, password, phone }: RegisterInput): Promise<AuthResponseDto> => {
  const existing = await findByEmail(email)
  if (existing) throw new Error('Email already in use')
  const hashed = await bcrypt.hash(password, 10)
  const user = await createUser({ name, email, password: hashed, phone })
  return { token: signToken(user.id), user: toUserResponse(user) }
}

export const login = async ({ email, password }: LoginInput): Promise<AuthResponseDto> => {
  const user = await findByEmail(email)
  if (!user) throw new Error('Invalid credentials')
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new Error('Invalid credentials')
  const { password: _, createdAt, ...safeUser } = user
  return {
    token: signToken(safeUser.id),
    user: toUserResponse({ ...safeUser, createdAt }),
  }
}
