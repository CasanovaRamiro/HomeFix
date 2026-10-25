import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/lib/envConfig.js', () => ({
  env: {
    get TELEGRAM_BOT_TOKEN() { return undefined },
    get FRONTEND_URL() { return 'http://localhost:5173' },
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
    expect(result).toEqual({ ok: false, reason: 'transient' })
  })

  it('no-op provider no falla con buttons', async () => {
    const { createTelegramProvider } = await import('../../src/infrastructure/providers/telegram.provider.js')
    const provider = createTelegramProvider()
    const result = await provider.send('123', {
      text: 'Hola',
      buttons: [{ text: 'Ver', url: 'http://localhost:5173/posts/abc' }],
    })
    expect(result).toEqual({ ok: false, reason: 'transient' })
  })

  it('reconoce solo el bloqueo explícito del usuario', async () => {
    const { isPermanentTelegramBlock } = await import('../../src/infrastructure/providers/telegram.provider.js')

    expect(isPermanentTelegramBlock({ code: 403, description: 'Forbidden: bot was blocked by the user' })).toBe(true)
    expect(isPermanentTelegramBlock({ response: { error_code: 403, description: 'Forbidden: bot was kicked from the group' } })).toBe(false)
    expect(isPermanentTelegramBlock({ code: 429, description: 'Too Many Requests' })).toBe(false)
  })

  it.each([
    ['timeout', new Error('timeout')],
    ['format error', { code: 400, description: 'Bad Request: formatting error' }],
    ['unknown error', { message: 'network failure' }],
  ])('clasifica %s como transitorio', async (_name, error) => {
    const { isPermanentTelegramBlock } = await import('../../src/infrastructure/providers/telegram.provider.js')
    expect(isPermanentTelegramBlock(error)).toBe(false)
  })
})
