import api from './api'
import type { UserRole } from '../types/user'

export interface AuthUser {
  id: string
  name: string
  email: string
  photo: string | null
  role: UserRole
}

export interface LoginResponse {
  accessToken: string
  idToken?: string
  user: AuthUser
}

export const login = (payload: { email: string; password: string }): Promise<LoginResponse> =>
  api.post<LoginResponse>('/auth/login', payload).then((r) => r.data)

export const resendVerification = (email: string) =>
  api.post('/auth/resend-verification', { email })

export interface RegisterResponse {
  userId: string
  email: string
  emailVerified: boolean
  roleAssigned: boolean
  message: string
}

export interface RegisterInput {
  name: string
  lastName: string
  email: string
  password: string
  phone?: string
}

export const register = (payload: RegisterInput): Promise<RegisterResponse> =>
  api.post<RegisterResponse>('/auth/register', payload).then((r) => r.data)

export interface RegisterWorkerInput extends RegisterInput {
  categories: string[]
}

export const registerWorker = (payload: RegisterWorkerInput): Promise<RegisterResponse> =>
  api.post<RegisterResponse>('/auth/register/worker', payload).then((r) => r.data)

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email })

export interface AuthMeResponse {
  id: string
  name: string
  email: string
  photo: string | null
  role: string
}

export const fetchMe = (headers: Record<string, string>): Promise<AuthMeResponse> =>
  api.get<AuthMeResponse>('/auth/me', { headers }).then((r) => r.data)
