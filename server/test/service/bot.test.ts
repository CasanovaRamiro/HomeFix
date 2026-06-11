import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/lib/prisma.js', () => ({
  default: {
    telegramLinkCode: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}))

vi.mock('../../src/infrastructure/providers/telegram.provider.js', () => ({
  getBot: vi.fn(() => ({
    telegram: {
      getMe: vi.fn().mockResolvedValue({ username: 'HomeFixTestBot' }),
    },
  })),
}))

import prisma from '../../src/lib/prisma.js'
import { createLinkCode, processLink } from '../../src/presentation/telegram/bot.js'

const makeCtx = (overrides: Record<string, unknown> = {}) => ({
  reply: vi.fn(),
  chat: { id: 12345 },
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createLinkCode', () => {
  it('crea un código de 8 caracteres alfanuméricos', async () => {
    vi.mocked(prisma.telegramLinkCode.create).mockResolvedValue({ id: '1', code: 'ABC12345' } as any)

    const code = await createLinkCode('user-1')

    expect(code).toMatch(/^[A-Z0-9]{8}$/)
  })

  it('guarda el código con expiresAt a 5 minutos', async () => {
    const before = Date.now()
    vi.mocked(prisma.telegramLinkCode.create).mockImplementation(async (args) => {
      const data = args.data as any
      return { id: '1', code: data.code, ...data } as any
    })

    await createLinkCode('user-1')

    const callArgs = vi.mocked(prisma.telegramLinkCode.create).mock.calls[0][0]
    const expiresAt = (callArgs.data as any).expiresAt as Date
    expect(expiresAt.getTime() - before).toBeGreaterThanOrEqual(4.5 * 60 * 1000)
    expect(expiresAt.getTime() - before).toBeLessThanOrEqual(5 * 60 * 1000)
  })

  it('asocia el código al userId provisto', async () => {
    vi.mocked(prisma.telegramLinkCode.create).mockImplementation(async (args) => {
      const data = args.data as any
      return { id: '1', code: data.code, ...data } as any
    })

    await createLinkCode('user-42')

    const callArgs = vi.mocked(prisma.telegramLinkCode.create).mock.calls[0][0]
    expect((callArgs.data as any).userId).toBe('user-42')
  })

  it('retorna el mismo código que guarda en la DB', async () => {
    vi.mocked(prisma.telegramLinkCode.create).mockImplementation(async (args) => {
      const data = args.data as any
      return { id: '1', code: data.code, ...data } as any
    })

    const code = await createLinkCode('user-1')

    const callArgs = vi.mocked(prisma.telegramLinkCode.create).mock.calls[0][0]
    expect(code).toBe((callArgs.data as any).code)
  })
})

describe('getBotUsername', () => {
  it('retorna el username del bot', async () => {
    const { getBotUsername } = await import('../../src/presentation/telegram/bot.js')
    const username = await getBotUsername()
    expect(username).toBe('HomeFixTestBot')
  })
})

describe('processLink', () => {
  it('vincula al usuario cuando el código es válido', async () => {
    const now = new Date()
    vi.mocked(prisma.telegramLinkCode.findUnique).mockResolvedValue({
      id: 'link-1',
      userId: 'user-1',
      code: 'ABC12345',
      used: false,
      expiresAt: new Date(now.getTime() + 60000),
      createdAt: now,
    } as any)

    const ctx = makeCtx()
    await processLink(ctx as any, 'ABC12345')

    expect(prisma.telegramLinkCode.update).toHaveBeenCalledWith({
      where: { id: 'link-1' },
      data: { used: true },
    })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        telegramChatId: '12345',
        telegramLinkedAt: expect.any(Date),
      },
    })
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('vinculada con éxito'))
  })

  it('rechaza un código inválido (no existe)', async () => {
    vi.mocked(prisma.telegramLinkCode.findUnique).mockResolvedValue(null)

    const ctx = makeCtx()
    await processLink(ctx as any, 'INVALIDO')

    expect(ctx.reply).toHaveBeenCalledWith('Código inválido o expirado. Generá uno nuevo en tu perfil.')
    expect(prisma.telegramLinkCode.update).not.toHaveBeenCalled()
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('rechaza un código expirado', async () => {
    const now = new Date()
    vi.mocked(prisma.telegramLinkCode.findUnique).mockResolvedValue({
      id: 'link-1',
      userId: 'user-1',
      code: 'EXPIRED',
      used: false,
      expiresAt: new Date(now.getTime() - 60000),
      createdAt: now,
    } as any)

    const ctx = makeCtx()
    await processLink(ctx as any, 'EXPIRED')

    expect(ctx.reply).toHaveBeenCalledWith('Código inválido o expirado. Generá uno nuevo en tu perfil.')
    expect(prisma.telegramLinkCode.update).not.toHaveBeenCalled()
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('rechaza un código ya usado', async () => {
    const now = new Date()
    vi.mocked(prisma.telegramLinkCode.findUnique).mockResolvedValue({
      id: 'link-1',
      userId: 'user-1',
      code: 'USED123',
      used: true,
      expiresAt: new Date(now.getTime() + 60000),
      createdAt: now,
    } as any)

    const ctx = makeCtx()
    await processLink(ctx as any, 'USED123')

    expect(ctx.reply).toHaveBeenCalledWith('Código inválido o expirado. Generá uno nuevo en tu perfil.')
    expect(prisma.telegramLinkCode.update).not.toHaveBeenCalled()
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('usa el chatId del contexto para vincular', async () => {
    const now = new Date()
    vi.mocked(prisma.telegramLinkCode.findUnique).mockResolvedValue({
      id: 'link-1',
      userId: 'user-1',
      code: 'ABC12345',
      used: false,
      expiresAt: new Date(now.getTime() + 60000),
      createdAt: now,
    } as any)

    const ctx = makeCtx({ chat: { id: 99999 } })
    await processLink(ctx as any, 'ABC12345')

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        telegramChatId: '99999',
        telegramLinkedAt: expect.any(Date),
      },
    })
  })

  it('maneja chat null (ctx.chat = null)', async () => {
    const now = new Date()
    vi.mocked(prisma.telegramLinkCode.findUnique).mockResolvedValue({
      id: 'link-1',
      userId: 'user-1',
      code: 'ABC12345',
      used: false,
      expiresAt: new Date(now.getTime() + 60000),
      createdAt: now,
    } as any)

    const ctx = makeCtx({ chat: null })
    await processLink(ctx as any, 'ABC12345')

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        telegramChatId: 'undefined',
        telegramLinkedAt: expect.any(Date),
      },
    })
  })
})
