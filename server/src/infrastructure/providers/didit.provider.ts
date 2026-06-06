import { env } from '../../lib/envConfig.js'

const DIDIT_API_BASE = 'https://verification.didit.me'
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
  const callbackUrl = env.DIDIT_CALLBACK_URL

  if (!apiKey) throw createHttpError(500, 'DIDIT_API_KEY is not configured')
  if (!workflowId) throw createHttpError(500, 'DIDIT_WORKFLOW_ID is not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${DIDIT_API_BASE}/v3/session/`, {
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
        ...(callbackUrl ? { callback: callbackUrl, callback_method: 'both' } : {}),
      }),
      signal: controller.signal,
    })
  } catch (e) {
    clearTimeout(timeout)
    console.error('[KYC] Didit request failed:', e)
    throw createHttpError(502, 'No se pudo contactar al servicio de verificación')
  }
  clearTimeout(timeout)

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    console.error('[KYC] Didit returned non-OK:', response.status, text)
    throw createHttpError(502, 'El servicio de verificación rechazó la solicitud')
  }

  const data = (await response.json()) as DiditSessionResponse
  if (!data.url || !data.session_id) {
    console.error('[KYC] Didit response missing url/session_id:', data)
    throw createHttpError(502, 'Respuesta inválida del servicio de verificación')
  }

  return { sessionUrl: data.url, sessionId: data.session_id }
}
