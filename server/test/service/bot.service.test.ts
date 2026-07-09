import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DomainLinkCode, BotUser } from '../../src/domain/types/bot.types.js'

vi.mock('../../src/infrastructure/database/bot.database.js', () => ({
  createLinkCode: vi.fn(),
  findLinkCode: vi.fn(),
  markLinkCodeUsed: vi.fn().mockResolvedValue(undefined),
  linkChatToUser: vi.fn().mockResolvedValue(undefined),
  findUserByChatId: vi.fn(),
  setEmergenciesEnabled: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/infrastructure/providers/telegram.provider.js', () => ({
  buildStartLink: vi.fn().mockResolvedValue('https://web.telegram.org/k/#?tgaddr=deep'),
}))

import * as db from '../../src/infrastructure/database/bot.database.js'
import { buildStartLink } from '../../src/infrastructure/providers/telegram.provider.js'
import { createLink, linkAccount, toggleEmergencies, resolveGreeting } from '../../src/domain/services/bot.service.js'

const makeLinkCode = (overrides: Partial<DomainLinkCode> = {}): DomainLinkCode => ({
  id: 'link-1',
  userId: 'user-1',
  used: false,
  expiresAt: new Date(Date.now() + 60000),
  ...overrides,
})

const makeUser = (overrides: Partial<BotUser> = {}): BotUser => ({
  id: 'user-1',
  name: 'Martín',
  role: 'worker',
  emergenciesEnabled: false,
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createLink', () => {
  it('genera un código de 8 caracteres, lo persiste con TTL de 5 minutos y arma el deep link', async () => {
    vi.mocked(db.createLinkCode).mockImplementation(async (_userId, code) => ({ code }))

    const info = await createLink('user-42')

    expect(info.code).toMatch(/^[A-Z0-9]{8}$/)
    expect(info.deepLink).toBe('https://web.telegram.org/k/#?tgaddr=deep')
    expect(buildStartLink).toHaveBeenCalledWith(info.code)
    const [userId, code, expiresAt] = vi.mocked(db.createLinkCode).mock.calls[0]
    expect(userId).toBe('user-42')
    expect(code).toBe(info.code)
    expect(expiresAt.getTime() - Date.now()).toBeGreaterThan(4.5 * 60 * 1000)
    expect(expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(5 * 60 * 1000)
  })
})

describe('linkAccount', () => {
  it('vincula con un código válido (normaliza mayúsculas y espacios)', async () => {
    vi.mocked(db.findLinkCode).mockResolvedValue(makeLinkCode())

    const result = await linkAccount('12345', '  abc12345 ')

    expect(db.findLinkCode).toHaveBeenCalledWith('ABC12345')
    expect(db.markLinkCodeUsed).toHaveBeenCalledWith('link-1')
    expect(db.linkChatToUser).toHaveBeenCalledWith('user-1', '12345')
    expect(result).toEqual({ status: 'linked' })
  })

  it('rechaza un código inexistente', async () => {
    vi.mocked(db.findLinkCode).mockResolvedValue(null)
    const result = await linkAccount('12345', 'NOPE')
    expect(result).toEqual({ status: 'invalid' })
    expect(db.linkChatToUser).not.toHaveBeenCalled()
  })

  it('rechaza un código expirado', async () => {
    vi.mocked(db.findLinkCode).mockResolvedValue(makeLinkCode({ expiresAt: new Date(Date.now() - 1000) }))
    const result = await linkAccount('12345', 'EXPIRED1')
    expect(result).toEqual({ status: 'invalid' })
    expect(db.markLinkCodeUsed).not.toHaveBeenCalled()
  })

  it('rechaza un código ya usado', async () => {
    vi.mocked(db.findLinkCode).mockResolvedValue(makeLinkCode({ used: true }))
    const result = await linkAccount('12345', 'USED1234')
    expect(result).toEqual({ status: 'invalid' })
    expect(db.markLinkCodeUsed).not.toHaveBeenCalled()
  })
})

describe('toggleEmergencies', () => {
  it('activa las emergencias para un worker', async () => {
    vi.mocked(db.findUserByChatId).mockResolvedValue(makeUser({ emergenciesEnabled: false }))
    const result = await toggleEmergencies('12345')
    expect(db.setEmergenciesEnabled).toHaveBeenCalledWith('user-1', true)
    expect(result).toEqual({ status: 'toggled', enabled: true })
  })

  it('desactiva las emergencias si ya estaban activas', async () => {
    vi.mocked(db.findUserByChatId).mockResolvedValue(makeUser({ emergenciesEnabled: true }))
    const result = await toggleEmergencies('12345')
    expect(db.setEmergenciesEnabled).toHaveBeenCalledWith('user-1', false)
    expect(result).toEqual({ status: 'toggled', enabled: false })
  })

  it('rechaza si la cuenta no está vinculada', async () => {
    vi.mocked(db.findUserByChatId).mockResolvedValue(null)
    const result = await toggleEmergencies('12345')
    expect(result).toEqual({ status: 'not_linked' })
    expect(db.setEmergenciesEnabled).not.toHaveBeenCalled()
  })

  it('rechaza si el usuario no es worker', async () => {
    vi.mocked(db.findUserByChatId).mockResolvedValue(makeUser({ role: 'user' }))
    const result = await toggleEmergencies('12345')
    expect(result).toEqual({ status: 'not_worker' })
    expect(db.setEmergenciesEnabled).not.toHaveBeenCalled()
  })
})

describe('resolveGreeting', () => {
  it('retorna el nombre cuando el chat está vinculado', async () => {
    vi.mocked(db.findUserByChatId).mockResolvedValue(makeUser({ name: 'Martín' }))
    const greeting = await resolveGreeting('12345')
    expect(greeting).toEqual({ linked: true, name: 'Martín' })
  })

  it('retorna no vinculado cuando no hay usuario', async () => {
    vi.mocked(db.findUserByChatId).mockResolvedValue(null)
    const greeting = await resolveGreeting('12345')
    expect(greeting).toEqual({ linked: false, name: null })
  })
})
