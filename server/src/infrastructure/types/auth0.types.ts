export interface Auth0SignupResponse {
  _id: string
  email: string
  email_verified: boolean
}

export interface Auth0TokenResponse {
  access_token: string
  id_token?: string
  token_type: string
  expires_in: number
}

export interface Auth0UserInfoResponse {
  sub?: string
  email?: string
  email_verified?: boolean
  name?: string
  nickname?: string
  phone_number?: string
}

export interface Auth0ManagementUser {
  user_id: string
  email: string
  email_verified: boolean
}
