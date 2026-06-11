import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifyUser, broadcastEmergency } from '../../src/domain/services/notification.service.js'

vi.mock('../../src/lib/prisma.js', () => ({
  default: {
    user: {
      update: vi.fn().mockResolvedValue({}),
      findMany: vi.fn(),
    },
  },
}))

let mockFrontendUrl = 'http://localhost:5173'
vi.mock('../../src/lib/envConfig.js', () => ({
  env: {
    get FRONTEND_URL() { return mockFrontendUrl },
  },
}))

vi.mock('../../src/infrastructure/database/user.database.js', () => ({
  findUserById: vi.fn(),
}))

import * as userData from '../../src/infrastructure/database/user.database.js'

const mockSend = vi.fn<() => Promise<boolean>>()
const mockProvider = {
  name: 'telegram',
  send: mockSend,
}

const mockUser = {
  id: 'user-1',
  name: 'Test',
  email: 'test@test.com',
  phone: null,
  telegramChatId: '123456789',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('notifyUser', () => {
  it('no llama a send si el usuario no tiene telegramChatId', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue({ ...mockUser, telegramChatId: null })
    await notifyUser(mockProvider, 'user-1', 'application_new', { workerName: 'Juan', postTitle: 'Arreglo' })
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('usa el template application_new', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    mockSend.mockResolvedValue(true)
    await notifyUser(mockProvider, 'user-1', 'application_new', { workerName: 'Juan', postTitle: 'Arreglo caño' })
    expect(mockSend).toHaveBeenCalledWith('123456789', {
      text: expect.stringContaining('Nuevo postulante'),
      parseMode: 'HTML',
    })
  })

  it('usa el template application_accepted', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    mockSend.mockResolvedValue(true)
    await notifyUser(mockProvider, 'user-1', 'application_accepted', { postTitle: 'Arreglo caño' })
    expect(mockSend).toHaveBeenCalledWith('123456789', {
      text: expect.stringContaining('Postulación aceptada'),
      parseMode: 'HTML',
    })
  })

  it('usa el template application_rejected', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    mockSend.mockResolvedValue(true)
    await notifyUser(mockProvider, 'user-1', 'application_rejected', { postTitle: 'Arreglo caño' })
    expect(mockSend).toHaveBeenCalledWith('123456789', {
      text: expect.stringContaining('Postulación rechazada'),
      parseMode: 'HTML',
    })
  })

  it('usa el template post_completed', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    mockSend.mockResolvedValue(true)
    await notifyUser(mockProvider, 'user-1', 'post_completed', { postTitle: 'Arreglo caño' })
    expect(mockSend).toHaveBeenCalledWith('123456789', {
      text: expect.stringContaining('Trabajo finalizado'),
      parseMode: 'HTML',
    })
  })

  it('usa el template post_cancelled', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    mockSend.mockResolvedValue(true)
    await notifyUser(mockProvider, 'user-1', 'post_cancelled', { postTitle: 'Arreglo caño' })
    expect(mockSend).toHaveBeenCalledWith('123456789', {
      text: expect.stringContaining('Trabajo cancelado'),
      parseMode: 'HTML',
    })
  })

  it('limpia telegramChatId si el envío falla', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    mockSend.mockResolvedValue(false)

    const prisma = (await import('../../src/lib/prisma.js')).default
    const updateSpy = vi.mocked(prisma.user.update)

    await notifyUser(mockProvider, 'user-1', 'application_new', { workerName: 'Juan', postTitle: 'Arreglo' })

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { telegramChatId: null, telegramLinkedAt: null },
    })
  })

  it('no limpia telegramChatId si el provider no es telegram', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    const otherProvider = { name: 'email', send: vi.fn().mockResolvedValue(false) }

    const prisma = (await import('../../src/lib/prisma.js')).default
    const updateSpy = vi.mocked(prisma.user.update)

    await notifyUser(otherProvider, 'user-1', 'application_new', { workerName: 'Juan', postTitle: 'Arreglo' })

    expect(updateSpy).not.toHaveBeenCalled()
  })

  it('incluye los datos del template en el texto', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    mockSend.mockResolvedValue(true)

    await notifyUser(mockProvider, 'user-1', 'application_new', { workerName: 'María García', postTitle: 'Cocina' })

    expect(mockSend).toHaveBeenCalledWith('123456789', {
      text: expect.stringContaining('María García'),
      parseMode: 'HTML',
    })
  })
})

describe('broadcastEmergency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrontendUrl = 'http://localhost:5173'
  })

  it('envía a workers con emergenciesEnabled y categoría coincidente', async () => {
    const prisma = (await import('../../src/lib/prisma.js')).default
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'worker-1', telegramChatId: '111' },
      { id: 'worker-2', telegramChatId: '222' },
    ] as never)
    mockSend.mockResolvedValue(true)

    await broadcastEmergency(mockProvider, 'post-1', 'Caño roto', 'Se rompió el caño del baño', 'cat-1')

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        emergenciesEnabled: true,
        telegramChatId: { not: null },
        categories: { some: { categoryId: 'cat-1' } },
      },
      select: { id: true, telegramChatId: true },
    })
    expect(mockSend).toHaveBeenCalledTimes(2)
  })

  it('incluye descripción en el mensaje', async () => {
    const prisma = (await import('../../src/lib/prisma.js')).default
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'worker-1', telegramChatId: '111' },
    ] as never)
    mockSend.mockResolvedValue(true)

    await broadcastEmergency(mockProvider, 'post-abc', 'Caño roto', 'Se rompió el caño del baño, pierde agua', 'cat-1')

    expect(mockSend).toHaveBeenCalledWith('111', {
      text: expect.stringContaining('Se rompió el caño del baño, pierde agua'),
      parseMode: 'HTML',
    })
  })

  it('incluye enlace como texto cuando FRONTEND_URL es HTTP', async () => {
    const prisma = (await import('../../src/lib/prisma.js')).default
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'worker-1', telegramChatId: '111' },
    ] as never)
    mockSend.mockResolvedValue(true)
    mockFrontendUrl = 'http://localhost:5173'

    await broadcastEmergency(mockProvider, 'post-abc', 'Caño roto', 'desc', 'cat-1')

    expect(mockSend).toHaveBeenCalledWith('111', {
      text: expect.stringContaining('http://localhost:5173/posts/post-abc'),
      parseMode: 'HTML',
    })
    const sent = (mockSend.mock.calls[0] as unknown[])[1] as Record<string, unknown>
    expect(sent.buttons).toBeUndefined()
  })

  it('incluye botón cuando FRONTEND_URL es HTTPS', async () => {
    const prisma = (await import('../../src/lib/prisma.js')).default
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'worker-1', telegramChatId: '111' },
    ] as never)
    mockSend.mockResolvedValue(true)
    mockFrontendUrl = 'https://homefix.vercel.app'

    await broadcastEmergency(mockProvider, 'post-abc', 'Caño roto', 'desc', 'cat-1')

    expect(mockSend).toHaveBeenCalledWith('111', {
      text: expect.stringContaining('https://homefix.vercel.app/posts/post-abc'),
      parseMode: 'HTML',
      buttons: [{ text: '🔍 Ver publicación', url: 'https://homefix.vercel.app/posts/post-abc' }],
    })
  })

  it('no desvincula al worker si el envío falla', async () => {
    const prisma = (await import('../../src/lib/prisma.js')).default
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'worker-1', telegramChatId: '111' },
    ] as never)
    mockSend.mockResolvedValue(false)

    await broadcastEmergency(mockProvider, 'post-1', 'Caño roto', 'desc', 'cat-1')

    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it('no hace nada si no hay workers con emergenciesEnabled', async () => {
    const prisma = (await import('../../src/lib/prisma.js')).default
    vi.mocked(prisma.user.findMany).mockResolvedValue([])

    await broadcastEmergency(mockProvider, 'post-1', 'Caño roto', 'desc', 'cat-1')

    expect(mockSend).not.toHaveBeenCalled()
  })
})
