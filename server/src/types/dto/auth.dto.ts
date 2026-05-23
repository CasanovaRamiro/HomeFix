import type { UserResponseDto } from './user.dto.js'

export interface AuthResponseDto {
  token: string
  user: UserResponseDto
}
