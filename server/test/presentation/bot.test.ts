import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Telegraf } from 'telegraf'

vi.mock('../../src/lib/envConfig.js', () => ({
  env: { CORS_ORIGIN: 'http://localhost:5173' },
}))

vi.mock('../../src/domain/services/bot.service.js', () => ({
  linkAccount: vi.fn(),
  toggleEmergencies: vi.fn(),
  resolveGreeting: vi.fn(),
}))

import * as service from '../../src/domain/services/bot.service.js'
import { registerTelegramHandlers } from '../../src/presentation/bot.js'

type Handler = (ctx: unknown) => unknown

interface Captured {
  start?: Handler
  text?: Handler
  commands: Record<string, Handler>
}

const capture = (): { bot: Telegraf; handlers: Captured } => {
  const handlers: Captured = { commands: {} }
  const bot = {
    start: (fn: Handler) => { handlers.start = fn },
    command: (name: string, fn: Handler) => { handlers.commands[name] = fn },
    on: (_event: string, fn: Handler) => { handlers.text = fn },
  } as unknown as Telegraf
  return { bot, handlers }
}

const makeCtx = (overrides: Record<string, unknown> = {}) => ({
  reply: vi.fn(),
  chat: { id: 12345 },
  ...overrides,
})

let handlers: Captured

beforeEach(() => {
  vi.clearAllMocks()
  const c = capture()
  handlers = c.handlers
  registerTelegramHandlers(c.bot)
})

describe('/start', () => {
  it('procesa el payload como código de vínculo', async () => {
    vi.mocked(service.linkAccount).mockResolvedValue({ status: 'linked' })
    const ctx = makeCtx({ payload: 'abc12345' })
    await handlers.start!(ctx)
    expect(service.linkAccount).toHaveBeenCalledWith('12345', 'abc12345')
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('vinculada con éxito'))
  })

  it('muestra la bienvenida sin payload', async () => {
    const ctx = makeCtx({ payload: '' })
    await handlers.start!(ctx)
    expect(service.linkAccount).not.toHaveBeenCalled()
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Bienvenido a HomeFix'))
  })
})

describe('/link', () => {
  it('responde error cuando el código es inválido', async () => {
    vi.mocked(service.linkAccount).mockResolvedValue({ status: 'invalid' })
    const ctx = makeCtx({ message: { text: '/link NOPE' } })
    await handlers.commands.link(ctx)
    expect(service.linkAccount).toHaveBeenCalledWith('12345', 'NOPE')
    expect(ctx.reply).toHaveBeenCalledWith('Código inválido o expirado. Generá uno nuevo en tu perfil.')
  })

  it('pide el código si no se envía ninguno', async () => {
    const ctx = makeCtx({ message: { text: '/link' } })
    await handlers.commands.link(ctx)
    expect(service.linkAccount).not.toHaveBeenCalled()
    expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Usá: /link'))
  })
})

describe('/emergencias', () => {
  it('confirma la activación', async () => {
    vi.mocked(service.toggleEmergencies).mockResolvedValue({ status: 'toggled', enabled: true })
    const ctx = makeCtx()
    await handlers.commands.emergencias(ctx)
    await vi.waitFor(() => expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('ACTIVADAS')))
  })

  it('avisa cuando la cuenta no está vinculada', async () => {
    vi.mocked(service.toggleEmergencies).mockResolvedValue({ status: 'not_linked' })
    const ctx = makeCtx()
    await handlers.commands.emergencias(ctx)
    await vi.waitFor(() => expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('No tenés tu cuenta vinculada')))
  })

  it('avisa cuando el usuario no es worker', async () => {
    vi.mocked(service.toggleEmergencies).mockResolvedValue({ status: 'not_worker' })
    const ctx = makeCtx()
    await handlers.commands.emergencias(ctx)
    await vi.waitFor(() => expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('Solo los trabajadores')))
  })
})

describe('text', () => {
  it('saluda al usuario vinculado con su nombre', async () => {
    vi.mocked(service.resolveGreeting).mockResolvedValue({ linked: true, name: 'Martín' })
    const ctx = makeCtx()
    await handlers.text!(ctx)
    await vi.waitFor(() =>
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('¡Hola Martín')),
    )
  })

  it('responde con instrucciones si no está vinculado', async () => {
    vi.mocked(service.resolveGreeting).mockResolvedValue({ linked: false, name: null })
    const ctx = makeCtx()
    await handlers.text!(ctx)
    await vi.waitFor(() =>
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('No tengo tu cuenta vinculada todavía')),
    )
  })
})
