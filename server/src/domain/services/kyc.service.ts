import { findByEmail, updateUserKycStatus } from '../../infrastructure/database/user.database.js'
import { createDiditSession, getSessionStatus } from '../../infrastructure/providers/didit.provider.js'

export type KycStatus = 'NOT_STARTED' | 'IN_REVIEW' | 'APPROVED' | 'DECLINED' | 'EXPIRED'

const DIDIT_STATUS_MAP: Record<string, KycStatus> = {
  Approved: 'APPROVED',
  Declined: 'DECLINED',
  Expired: 'EXPIRED',
  Abandoned: 'EXPIRED',
  'Kyc Expired': 'EXPIRED',
  'In Review': 'IN_REVIEW',
  Resubmitted: 'IN_REVIEW',
  'Awaiting User': 'IN_REVIEW',
  'In Progress': 'IN_REVIEW',
  'Not Started': 'NOT_STARTED',
}

const createHttpError = (status: number, message: string): Error & { status?: number } => {
  const err = new Error(message) as Error & { status?: number }
  err.status = status
  return err
}

export const startKycVerification = async (
  email: string,
): Promise<{ sessionUrl: string; sessionId: string }> => {
  const user = await findByEmail(email)
  if (!user) {
    throw createHttpError(404, 'Usuario autenticado no encontrado en la base de datos')
  }
  return createDiditSession(user.id)
}

export const confirmKyc = async (
  email: string,
  sessionId: string,
): Promise<{ status: KycStatus; sessionId: string }> => {
  const user = await findByEmail(email)
  if (!user) {
    throw createHttpError(404, 'Usuario autenticado no encontrado en la base de datos')
  }

  const session = await getSessionStatus(sessionId)
  const mappedStatus = DIDIT_STATUS_MAP[session.status] ?? 'IN_REVIEW'

  const now = mappedStatus === 'APPROVED' || mappedStatus === 'DECLINED' || mappedStatus === 'EXPIRED'
    ? new Date()
    : null

  await updateUserKycStatus(email, {
    kycStatus: mappedStatus,
    kycVerifiedAt: now,
    kycSessionId: sessionId,
  })

  return { status: mappedStatus, sessionId }
}

export const getKycStatus = async (
  email: string,
): Promise<{ kycStatus: KycStatus; kycVerifiedAt: Date | null; kycSessionId: string | null }> => {
  const user = await findByEmail(email)
  if (!user) {
    throw createHttpError(404, 'Usuario autenticado no encontrado en la base de datos')
  }

  return {
    kycStatus: (user.kycStatus as KycStatus) ?? 'NOT_STARTED',
    kycVerifiedAt: user.kycVerifiedAt ?? null,
    kycSessionId: user.kycSessionId ?? null,
  }
}
