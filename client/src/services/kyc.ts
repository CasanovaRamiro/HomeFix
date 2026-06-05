import api from './api'

export interface KycSessionResponse {
  sessionUrl: string
  sessionId: string
}

export const startKycVerification = (): Promise<KycSessionResponse> =>
  api.post<KycSessionResponse>('/kyc/session').then((r) => r.data)
