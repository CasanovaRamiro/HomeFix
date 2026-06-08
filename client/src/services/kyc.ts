import api from './api'

export type KycStatus = 'NOT_STARTED' | 'IN_REVIEW' | 'APPROVED' | 'DECLINED' | 'EXPIRED'

export interface KycSessionResponse {
  sessionUrl: string
  sessionId: string
}

export interface KycConfirmResponse {
  status: string
  sessionId: string
}

export interface KycStatusResponse {
  kycStatus: KycStatus
  kycVerifiedAt: string | null
  kycSessionId: string | null
}

export const startKycVerification = (): Promise<KycSessionResponse> =>
  api.post<KycSessionResponse>('/kyc/session').then((r) => r.data)

export const confirmKycSession = (sessionId: string, email: string): Promise<KycConfirmResponse> =>
  api.post<KycConfirmResponse>('/kyc/confirm', { sessionId, email }).then((r) => r.data)

export const fetchKycStatus = (): Promise<KycStatusResponse> =>
  api.get<KycStatusResponse>('/kyc/status').then((r) => r.data)
