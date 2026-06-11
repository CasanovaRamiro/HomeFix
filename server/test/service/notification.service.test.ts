import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifyUser } from '../../src/domain/services/notification.service.js'

vi.mock('../../src/lib/prisma.js', () => ({
  default: {
    user: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
}))

vi.mock('../../src/infrastructure/database/user.database.js', () => ({
  findUserById: vi.fn(),
}))

import * as userData from '../../src/infrastructure/database/user.database.js'

const mockProvider = {
  name: 'telegram',
  send: vi.fn<(...args: any[]) => Promise<boolean>>(),
}

const mockUser = {
  id: 'user-1',
  name: 'Test',
  email: 'test@test.com',
  telegramChatId: '123456789',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('notifyUser', () => {
  it('no llama a send si el usuario no tiene telegramChatId', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue({ ...mockUser, telegramChatId: null })
    await notifyUser(mockProvider, 'user-1', 'application_new', { workerName: 'Juan', postTitle: 'Arreglo' })
    expect(mockProvider.send).not.toHaveBeenCalled()
  })

  it('usa el template application_new', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    mockProvider.send.mockResolvedValue(true)
    await notifyUser(mockProvider, 'user-1', 'application_new', { workerName: 'Juan', postTitle: 'Arreglo caño' })
    expect(mockProvider.send).toHaveBeenCalledWith('123456789', {
      text: expect.stringContaining('Nuevo postulante'),
      parseMode: 'HTML',
    })
  })

  it('usa el template application_accepted', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    mockProvider.send.mockResolvedValue(true)
    await notifyUser(mockProvider, 'user-1', 'application_accepted', { postTitle: 'Arreglo caño' })
    expect(mockProvider.send).toHaveBeenCalledWith('123456789', {
      text: expect.stringContaining('Postulación aceptada'),
      parseMode: 'HTML',
    })
  })

  it('usa el template application_rejected', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    mockProvider.send.mockResolvedValue(true)
    await notifyUser(mockProvider, 'user-1', 'application_rejected', { postTitle: 'Arreglo caño' })
    expect(mockProvider.send).toHaveBeenCalledWith('123456789', {
      text: expect.stringContaining('Postulación rechazada'),
      parseMode: 'HTML',
    })
  })

  it('usa el template post_completed', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    mockProvider.send.mockResolvedValue(true)
    await notifyUser(mockProvider, 'user-1', 'post_completed', { postTitle: 'Arreglo caño' })
    expect(mockProvider.send).toHaveBeenCalledWith('123456789', {
      text: expect.stringContaining('Trabajo finalizado'),
      parseMode: 'HTML',
    })
  })

  it('usa el template post_cancelled', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    mockProvider.send.mockResolvedValue(true)
    await notifyUser(mockProvider, 'user-1', 'post_cancelled', { postTitle: 'Arreglo caño' })
    expect(mockProvider.send).toHaveBeenCalledWith('123456789', {
      text: expect.stringContaining('Trabajo cancelado'),
      parseMode: 'HTML',
    })
  })

  it('limpia telegramChatId si el envío falla', async () => {
    vi.mocked(userData.findUserById).mockResolvedValue(mockUser)
    mockProvider.send.mockResolvedValue(false)

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
    mockProvider.send.mockResolvedValue(true)

    await notifyUser(mockProvider, 'user-1', 'application_new', { workerName: 'María García', postTitle: 'Cocina' })

    expect(mockProvider.send).toHaveBeenCalledWith('123456789', {
      text: expect.stringContaining('María García'),
      parseMode: 'HTML',
    })
  })
})
