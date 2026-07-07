import { logger } from '../../lib/logger.js'
import { env } from '../../lib/envConfig.js'

const TIMEOUT_MS = 10_000

interface DiditSessionResponse {
  session_id?: string
  url?: string
  workflow_id?: string
  vendor_data?: string
  status?: string
}

const createHttpError = (status: number, message: string): Error & { status?: number } => {
  const err = new Error(message) as Error & { status?: number }
  err.status = status
  return err
}

export const createDiditSession = async (
  vendorData: string,
): Promise<{ sessionUrl: string; sessionId: string }> => {
  const apiKey = env.DIDIT_API_KEY
  const workflowId = env.DIDIT_WORKFLOW_ID

  if (!apiKey) throw createHttpError(500, 'DIDIT_API_KEY is not configured')
  if (!workflowId) throw createHttpError(500, 'DIDIT_WORKFLOW_ID is not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${env.DIDIT_BASE_URL}/v3/session/`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        vendor_data: vendorData,
        expected_details: { id_country: 'ARG' },
      }),
      signal: controller.signal,
    })
  } catch (e) {
    clearTimeout(timeout)
    logger.error({ err: e, action: 'didit.createSession' }, 'Didit request failed')
    throw createHttpError(502, 'No se pudo contactar al servicio de verificación')
  }
  clearTimeout(timeout)

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    logger.error({ status: response.status, body: text, action: 'didit.createSession' }, 'Didit returned non-OK')
    throw createHttpError(502, 'El servicio de verificación rechazó la solicitud')
  }

  const data = (await response.json()) as DiditSessionResponse
  if (!data.url || !data.session_id) {
    logger.error({ data, action: 'didit.createSession' }, 'Didit response missing url/session_id')
    throw createHttpError(502, 'Respuesta inválida del servicio de verificación')
  }

  return { sessionUrl: data.url, sessionId: data.session_id }
}

export interface DiditDecision {
  sessionId: string
  status: string
  sessionKind: string
  vendorData: string | null
  idVerifications: unknown[]
  livenessChecks: unknown[]
  faceMatches: unknown[]
  amlScreenings: unknown[]
}

export const getDecision = async (sessionId: string): Promise<DiditDecision> => {
  const apiKey = env.DIDIT_API_KEY
  if (!apiKey) throw createHttpError(500, 'DIDIT_API_KEY is not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${env.DIDIT_BASE_URL}/v3/session/${sessionId}/decision/`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
  } catch (e) {
    clearTimeout(timeout)
    logger.error({ err: e, action: 'didit.getDecision' }, 'Didit getDecision failed')
    throw createHttpError(502, 'No se pudo contactar al servicio de verificación')
  }
  clearTimeout(timeout)

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    logger.error({ status: response.status, body: text, action: 'didit.getDecision' }, 'Didit getDecision returned non-OK')
    if (response.status === 404) {
      throw createHttpError(404, 'La sesión de verificación no existe')
    }
    throw createHttpError(502, 'El servicio de verificación rechazó la solicitud')
  }

  const data = (await response.json()) as Record<string, unknown>
  if (!data.session_id) {
    logger.error({ data, action: 'didit.getDecision' }, 'Didit getDecision missing session_id')
    throw createHttpError(502, 'Respuesta inválida del servicio de verificación')
  }

  return {
    sessionId: data.session_id as string,
    status: (data.status as string) ?? 'UNKNOWN',
    sessionKind: (data.session_kind as string) ?? 'user',
    vendorData: (data.vendor_data as string) ?? null,
    idVerifications: (data.id_verifications as unknown[]) ?? [],
    livenessChecks: (data.liveness_checks as unknown[]) ?? [],
    faceMatches: (data.face_matches as unknown[]) ?? [],
    amlScreenings: (data.aml_screenings as unknown[]) ?? [],
  }
}

export const getSessionStatus = async (
  sessionId: string,
): Promise<{ sessionId: string; status: string; url: string }> => {
  const apiKey = env.DIDIT_API_KEY
  if (!apiKey) throw createHttpError(500, 'DIDIT_API_KEY is not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${env.DIDIT_BASE_URL}/v3/session/${sessionId}/`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
  } catch (e) {
    clearTimeout(timeout)
    logger.error({ err: e, action: 'didit.getSessionStatus' }, 'Didit getSessionStatus failed')
    throw createHttpError(502, 'No se pudo contactar al servicio de verificación')
  }
  clearTimeout(timeout)

  if (!response.ok) {
    if (response.status === 404) {
      throw createHttpError(404, 'La sesión de verificación no existe')
    }
    const text = await response.text().catch(() => '')
    logger.error({ status: response.status, body: text, action: 'didit.getSessionStatus' }, 'Didit getSessionStatus returned non-OK')
    throw createHttpError(502, 'El servicio de verificación rechazó la solicitud')
  }

  const data = (await response.json()) as DiditSessionResponse
  if (!data.session_id) {
    logger.error({ data, action: 'didit.getSessionStatus' }, 'Didit getSessionStatus missing session_id')
    throw createHttpError(502, 'Respuesta inválida del servicio de verificación')
  }

  return {
    sessionId: data.session_id,
    status: data.status ?? 'UNKNOWN',
    url: data.url ?? '',
  }
}
