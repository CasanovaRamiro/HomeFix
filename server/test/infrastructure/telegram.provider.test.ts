import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/lib/envConfig.js', () => ({
  env: {
    get TELEGRAM_BOT_TOKEN() { return undefined },
  },
}))

describe('telegram.provider', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('getBot lanza error cuando TELEGRAM_BOT_TOKEN no está configurado', async () => {
    const { getBot } = await import('../../src/infrastructure/providers/telegram.provider.js')
    expect(() => getBot()).toThrow('TELEGRAM_BOT_TOKEN is not configured')
  })

  it('createTelegramProvider retorna no-op cuando no hay token', async () => {
    const { createTelegramProvider } = await import('../../src/infrastructure/providers/telegram.provider.js')
    const provider = createTelegramProvider()
    expect(provider.name).toBe('telegram')
    const result = await provider.send('123', { text: 'test' })
    expect(result).toBe(false)
  })
})
