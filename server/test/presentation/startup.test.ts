import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import express from 'express'
import type { Server } from 'node:http'

const startup = vi.hoisted(() => ({
  migrations: vi.fn<() => Promise<void>>(),
  createCategories: vi.fn<() => Promise<{ count: number }>>(),
}))

vi.mock('../../src/lib/envConfig.js', () => ({ env: { NODE_ENV: 'production', PORT: '3002' } }))
vi.mock('../../src/lib/assertMigrations.js', () => ({ assertMigrationsApplied: startup.migrations }))
vi.mock('../../src/lib/prisma.js', () => ({ default: { category: { createMany: startup.createCategories } } }))
vi.mock('../../src/lib/logger.js', () => ({ logger: { info: vi.fn(), fatal: vi.fn() } }))
vi.mock('../../src/presentation/routes/index.js', () => ({ registerRoutes: vi.fn() }))
vi.mock('../../src/infrastructure/providers/telegram.provider.js', () => ({ launchBot: vi.fn() }))
vi.mock('../../src/presentation/bot.js', () => ({ registerTelegramHandlers: vi.fn() }))

const originalRejectionListeners = process.listeners('unhandledRejection')
let listen: MockInstance<typeof express.application.listen>

beforeEach(() => {
  vi.resetModules()
  vi.resetAllMocks()
  startup.migrations.mockResolvedValue(undefined)
  startup.createCategories.mockResolvedValue({ count: 8 })
  listen = vi.spyOn(express.application, 'listen').mockReturnValue({} as Server)
})

afterEach(() => {
  vi.restoreAllMocks()
  for (const listener of process.listeners('unhandledRejection')) {
    if (!originalRejectionListeners.includes(listener)) process.removeListener('unhandledRejection', listener)
  }
})

describe('API startup category availability', () => {
  it('waits for the catalog before listening for requests', async () => {
    let complete: (value: { count: number }) => void = () => undefined
    startup.createCategories.mockReturnValue(new Promise((resolve) => { complete = resolve }))
    const importing = import('../../src/index.js')

    await vi.waitFor(() => expect(startup.createCategories).toHaveBeenCalledOnce())
    expect(listen).not.toHaveBeenCalled()
    complete({ count: 8 })
    await importing
    expect(listen).toHaveBeenCalledOnce()
  })

  it('does not start the API when catalog initialization fails', async () => {
    const error = new Error('Catalog initialization failed')
    startup.createCategories.mockRejectedValue(error)

    await expect(import('../../src/index.js')).rejects.toBe(error)
    expect(listen).not.toHaveBeenCalled()
  })

  it('does not seed or start when migrations could not be verified', async () => {
    const error = new Error('Pending migrations')
    startup.migrations.mockRejectedValue(error)

    await expect(import('../../src/index.js')).rejects.toBe(error)
    expect(startup.createCategories).not.toHaveBeenCalled()
    expect(listen).not.toHaveBeenCalled()
  })
})
