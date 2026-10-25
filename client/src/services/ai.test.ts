import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AI_JSON_LIMIT_BYTES,
  AiPayloadTooLargeError,
  sendMessage,
} from './ai'

const mockPost = vi.hoisted(() => vi.fn())

vi.mock('./api', () => ({
  default: { post: mockPost },
}))

describe('AI service payload limits', () => {
  beforeEach(() => {
    mockPost.mockReset()
  })

  it('rejects an oversized history before sending', async () => {
    const messages = [{ role: 'user' as const, text: 'a'.repeat(AI_JSON_LIMIT_BYTES) }]

    await expect(sendMessage(messages)).rejects.toBeInstanceOf(AiPayloadTooLargeError)
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('does not retry a 413 response', async () => {
    const error = Object.assign(new Error('request entity too large'), {
      isAxiosError: true,
      response: { status: 413 },
    })
    mockPost.mockRejectedValue(error)

    await expect(sendMessage([{ role: 'user', text: 'imagen' }])).rejects.toBeInstanceOf(AiPayloadTooLargeError)
    expect(mockPost).toHaveBeenCalledTimes(1)
  })
})
