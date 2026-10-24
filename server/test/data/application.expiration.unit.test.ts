import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PostType } from '../../src/domain/types/postType.js'
import { PostStatus } from '../../src/domain/types/postStatus.js'
import { ApplicationStatus } from '../../src/domain/types/applicationStatus.js'

const db = vi.hoisted(() => {
  const applicationCreate = vi.fn()
  const applicationUpdateMany = vi.fn()
  const postUpdateMany = vi.fn()
  const tx = {
    $queryRaw: vi.fn(),
    application: { create: applicationCreate, updateMany: applicationUpdateMany },
    post: { updateMany: postUpdateMany },
  }
  return {
    applicationCreate,
    applicationUpdateMany,
    postUpdateMany,
    tx,
    prisma: {
      application: { create: applicationCreate },
      $transaction: vi.fn(<T>(cb: (client: typeof tx) => T): T => cb(tx)),
    },
  }
})

vi.mock('../../src/lib/prisma.js', () => ({ default: db.prisma }))

import { createApplication } from '../../src/infrastructure/database/application.database.js'
import { activateEmergencyPost, releaseEmergencyPost } from '../../src/infrastructure/database/post.database.js'

const past = new Date(Date.now() - 60_000)
const future = new Date(Date.now() + 60_000)

beforeEach(() => {
  vi.clearAllMocks()
  db.applicationCreate.mockResolvedValue({ id: 'app-1', status: ApplicationStatus.Pending })
  db.applicationUpdateMany.mockResolvedValue({ count: 1 })
  db.postUpdateMany.mockResolvedValue({ count: 1 })
})

describe('createApplication on an emergency', () => {
  it('rejects the insert when the deadline passed between the read and the write', async () => {
    db.tx.$queryRaw.mockResolvedValue([
      { type: PostType.Emergency, isEmergency: 1, emergencyExpiresAt: past, status: PostStatus.Active },
    ])

    await expect(createApplication('worker-1', { postId: 'post-1' }, true)).rejects.toMatchObject({ status: 400 })
    expect(db.applicationCreate).not.toHaveBeenCalled()
  })

  it('creates the application while the emergency is still current', async () => {
    db.tx.$queryRaw.mockResolvedValue([
      { type: PostType.Emergency, isEmergency: 1, emergencyExpiresAt: future, status: PostStatus.Active },
    ])

    await expect(createApplication('worker-1', { postId: 'post-1' }, true)).resolves.toMatchObject({ id: 'app-1' })
    expect(db.tx.$queryRaw.mock.calls[0][0].join('')).toContain('FOR UPDATE')
  })

  it('does not open a transaction for ordinary posts', async () => {
    await createApplication('worker-1', { postId: 'post-1' })

    expect(db.prisma.$transaction).not.toHaveBeenCalled()
    expect(db.applicationCreate).toHaveBeenCalledOnce()
  })
})

describe('emergency reactivation guards', () => {
  it('rejects reactivation when the conditional update no longer matches', async () => {
    db.postUpdateMany.mockResolvedValue({ count: 0 })

    await expect(activateEmergencyPost('post-1', PostStatus.Paused)).rejects.toMatchObject({ status: 400 })
  })

  it('reactivates a current emergency and can reset accepted applications', async () => {
    const result = await activateEmergencyPost('post-1', PostStatus.InProgress, true)

    expect(result).toEqual({ id: 'post-1', status: PostStatus.Active })
    expect(db.postUpdateMany).toHaveBeenCalledWith({
      where: { id: 'post-1', status: PostStatus.InProgress, emergencyExpiresAt: { gt: expect.any(Date) } },
      data: { status: PostStatus.Active },
    })
    expect(db.applicationUpdateMany).toHaveBeenCalledOnce()
  })

  it('reopens a current emergency after dismissal', async () => {
    await releaseEmergencyPost('post-1')

    expect(db.postUpdateMany).toHaveBeenCalledTimes(1)
    expect(db.postUpdateMany).toHaveBeenCalledWith({
      where: { id: 'post-1', status: PostStatus.InProgress, emergencyExpiresAt: { gt: expect.any(Date) } },
      data: { status: PostStatus.Active },
    })
  })

  it('pauses an expired emergency instead of reactivating it', async () => {
    db.postUpdateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 })

    await releaseEmergencyPost('post-1')

    expect(db.postUpdateMany).toHaveBeenLastCalledWith({
      where: { id: 'post-1', status: PostStatus.InProgress },
      data: { status: PostStatus.Paused },
    })
  })
})
