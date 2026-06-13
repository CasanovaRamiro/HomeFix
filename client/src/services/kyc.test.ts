import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from './api'
import { startKycVerification, confirmKycSession, type KycSessionResponse, type KycConfirmResponse } from './kyc'

vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('confirmKycSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hace POST a /kyc/confirm con el sessionId y email', async () => {
    const response: KycConfirmResponse = { status: 'APPROVED', sessionId: 'sess-1' }
    vi.mocked(api.post).mockResolvedValue({ data: response } as never)

    await confirmKycSession('sess-1', 'test@example.com')

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith('/kyc/confirm', { sessionId: 'sess-1', email: 'test@example.com' })
  })

  it('devuelve el status y sessionId del response', async () => {
    const response: KycConfirmResponse = { status: 'APPROVED', sessionId: 'sess-1' }
    vi.mocked(api.post).mockResolvedValue({ data: response } as never)

    const result = await confirmKycSession('sess-1', 'test@example.com')

    expect(result).toEqual(response)
  })

  it('propaga el error cuando la API falla', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))

    await expect(confirmKycSession('sess-1', 'test@example.com')).rejects.toThrow()
  })
})

describe('startKycVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hace POST a /kyc/session', async () => {
    const response: KycSessionResponse = {
      sessionUrl: 'https://verify.didit.me/session/sess-1',
      sessionId: 'sess-1',
    }
    vi.mocked(api.post).mockResolvedValue({ data: response } as never)

    await startKycVerification()

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith('/kyc/session')
  })

  it('devuelve sessionUrl y sessionId del response', async () => {
    const response: KycSessionResponse = {
      sessionUrl: 'https://verify.didit.me/session/sess-1',
      sessionId: 'sess-1',
    }
    vi.mocked(api.post).mockResolvedValue({ data: response } as never)

    const result = await startKycVerification()

    expect(result).toEqual(response)
  })

  it('propaga el error cuando la API falla', async () => {
    const err = new Error('boom')
    vi.mocked(api.post).mockRejectedValue(err)

    await expect(startKycVerification()).rejects.toBe(err)
  })
})
