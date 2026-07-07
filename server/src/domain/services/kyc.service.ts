import { logger } from '../../lib/logger.js'
import { findByEmail, updateUserKycStatus } from '../../infrastructure/database/user.database.js'
import { createDiditSession, getSessionStatus, getDecision } from '../../infrastructure/providers/didit.provider.js'
import { createHttpError } from '../../lib/errors.js'

export type KycStatus = 'NOT_STARTED' | 'IN_REVIEW' | 'APPROVED' | 'DECLINED' | 'EXPIRED'

const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  NOT_STARTED: 'no iniciada',
  IN_REVIEW: 'en revisión',
  APPROVED: 'aprobada',
  DECLINED: 'rechazada',
  EXPIRED: 'expirada',
}

const NOTIFIABLE_STATUSES: KycStatus[] = ['APPROVED', 'DECLINED']

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
  'Not Finished': 'IN_REVIEW',
}

const DIDIT_STATUS_MAP_LOWER: Record<string, KycStatus> = Object.fromEntries(
  Object.entries(DIDIT_STATUS_MAP).map(([k, v]) => [k.toLowerCase(), v]),
)

function mapDiditStatus(raw: string): KycStatus {
  const exact = DIDIT_STATUS_MAP[raw]
  if (exact) return exact
  const lower = DIDIT_STATUS_MAP_LOWER[raw.toLowerCase()]
  if (lower) return lower
  logger.warn({ rawStatus: raw, action: 'kyc.mapStatus' }, 'Unknown Didit status, mapping to IN_REVIEW')
  return 'IN_REVIEW'
}

export const startKycVerification = async (
  email: string,
): Promise<{ sessionUrl: string; sessionId: string }> => {
  const user = await findByEmail(email)
  if (!user) {
    throw createHttpError(404, 'Usuario autenticado no encontrado en la base de datos')
  }
  if (user.kycStatus === 'APPROVED') {
    throw createHttpError(409, 'Ya tenés la verificación aprobada')
  }
  if (user.kycStatus === 'IN_REVIEW') {
    throw createHttpError(409, 'Ya tenés una verificación en curso')
  }
  return createDiditSession(user.email)
}

export const confirmKyc = async (
  email: string,
  sessionId: string,
  sdkStatus?: string,
): Promise<{ status: KycStatus; sessionId: string }> => {
  const user = await findByEmail(email)
  if (!user) {
    throw createHttpError(404, 'Usuario autenticado no encontrado en la base de datos')
  }

  let diditStatus: string
  let lastError: (Error & { status?: number }) | null = null
  try {
    const decision = await getDecision(sessionId)
    diditStatus = decision.status
  } catch (e) {
    lastError = e as Error & { status?: number }
    if (sdkStatus) {
      diditStatus = sdkStatus
    } else {
      try {
        const session = await getSessionStatus(sessionId)
        diditStatus = session.status
      } catch {
        throw lastError.status === 404
          ? createHttpError(404, 'La sesión de verificación no existe')
          : createHttpError(502, 'No se pudo obtener el estado de la verificación')
      }
    }
  }

  const mappedStatus = mapDiditStatus(diditStatus)

  const now = mappedStatus === 'APPROVED' || mappedStatus === 'DECLINED' || mappedStatus === 'EXPIRED'
    ? new Date()
    : null

  await updateUserKycStatus(email, {
    kycStatus: mappedStatus,
    kycVerifiedAt: now,
    diditVerificationId: sessionId,
  })

  return { status: mappedStatus, sessionId }
}

export const getKycStatus = async (
  email: string,
): Promise<{ kycStatus: KycStatus; kycVerifiedAt: Date | null; diditVerificationId: string | null }> => {
  const user = await findByEmail(email)
  if (!user) {
    throw createHttpError(404, 'Usuario autenticado no encontrado en la base de datos')
  }

  let kycStatus = (user.kycStatus as KycStatus) ?? 'NOT_STARTED'
  let kycVerifiedAt = user.kycVerifiedAt ?? null

  const TERMINAL_STATUSES: KycStatus[] = ['APPROVED', 'DECLINED', 'EXPIRED', 'IN_REVIEW']
  if (TERMINAL_STATUSES.includes(kycStatus) && user.diditVerificationId) {
    let diditStatus: string | null = null

    try {
      const decision = await getDecision(user.diditVerificationId)
      diditStatus = decision.status
    } catch {
      try {
        const session = await getSessionStatus(user.diditVerificationId)
        diditStatus = session.status
      } catch {
        // Ambos endpoints fallaron, mantener status actual
      }
    }

    if (diditStatus) {
      const mappedStatus = mapDiditStatus(diditStatus)
      if (mappedStatus !== kycStatus) {
        logger.info({ email, from: kycStatus, to: mappedStatus, action: 'kyc.statusChanged' }, `KYC status changed for ${email}`)
        const now = mappedStatus === 'APPROVED' || mappedStatus === 'DECLINED' || mappedStatus === 'EXPIRED'
          ? new Date()
          : null
        await updateUserKycStatus(email, {
          kycStatus: mappedStatus,
          kycVerifiedAt: now,
          diditVerificationId: user.diditVerificationId,
        })
        kycStatus = mappedStatus
        kycVerifiedAt = now
      }
    }
  }

  return { kycStatus, kycVerifiedAt, diditVerificationId: user.diditVerificationId ?? null }
}

export interface KycDecision {
  sessionId: string
  status: KycStatus
  sessionKind: string
  vendorData: string | null
  idVerifications: unknown[]
  livenessChecks: unknown[]
  faceMatches: unknown[]
  amlScreenings: unknown[]
}

export const getKycDecision = async (sessionId: string): Promise<KycDecision> => {
  const decision = await getDecision(sessionId)
  return {
    sessionId: decision.sessionId,
    status: mapDiditStatus(decision.status),
    sessionKind: decision.sessionKind,
    vendorData: decision.vendorData,
    idVerifications: decision.idVerifications,
    livenessChecks: decision.livenessChecks,
    faceMatches: decision.faceMatches,
    amlScreenings: decision.amlScreenings,
  }
}

export interface WebhookPayload {
  event_id: string
  webhook_type: string
  timestamp: number
  session_id: string
  status: string
  vendor_data?: string
}

export const handleKycWebhook = async (
  payload: WebhookPayload,
): Promise<{ processed: boolean }> => {
  if (payload.webhook_type !== 'status.updated') {
    return { processed: false }
  }

  const email = payload.vendor_data
  if (!email) {
    logger.warn({ eventId: payload.event_id, action: 'kyc.webhook' }, 'Webhook missing vendor_data, ignoring')
    return { processed: false }
  }

  const user = await findByEmail(email)
  if (!user) {
    logger.warn({ email, eventId: payload.event_id, action: 'kyc.webhook' }, 'Webhook for non-existent user')
    return { processed: false }
  }

  const mappedStatus = mapDiditStatus(payload.status)

  if (user.kycStatus === mappedStatus) {
    return { processed: false }
  }

  const now = mappedStatus === 'APPROVED' || mappedStatus === 'DECLINED' || mappedStatus === 'EXPIRED'
    ? new Date()
    : null

  await updateUserKycStatus(email, {
    kycStatus: mappedStatus,
    kycVerifiedAt: now,
    diditVerificationId: payload.session_id,
  })

  logger.info({ email, status: mappedStatus, eventId: payload.event_id, action: 'kyc.webhookProcessed' }, 'KYC webhook processed')

  if (NOTIFIABLE_STATUSES.includes(mappedStatus)) {
    notifyKycStatus(email, user.name ?? email, mappedStatus).catch((err) => {
      logger.error({ err, email, status: mappedStatus, action: 'kyc.notify' }, 'Error sending KYC notification')
    })
  }

  return { processed: true }
}

async function notifyKycStatus(
  toEmail: string,
  _userName: string,
  status: KycStatus,
): Promise<void> {
  const label = KYC_STATUS_LABELS[status]
  logger.info({ email: toEmail, status, action: 'kyc.emailNotification' }, `KYC email notification → ${toEmail}: ${label}`)

  // TODO: integrar con proveedor de email (SendGrid, SES, etc.)
  // Ejemplo futuro con SendGrid:
  // await sendGridMail.send({
  //   from: 'noreply@homefix.com',
  //   to: toEmail,
  //   subject: `HomeFix - Verificación ${label}`,
  //   text: `Hola ${userName}, tu verificación de identidad fue ${label}.`,
  // })
}
