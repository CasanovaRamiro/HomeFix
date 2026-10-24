import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PostType } from '../../src/domain/types/postType.js'
import { isExpiredEmergency } from '../../src/domain/services/emergency-expiration.js'

const db = vi.hoisted(() => ({
  post: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    deleteMany: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
  },
  postCategory: { deleteMany: vi.fn(), create: vi.fn() },
  application: { findUnique: vi.fn(), deleteMany: vi.fn(), updateMany: vi.fn() },
  workerReview: { findUnique: vi.fn(), deleteMany: vi.fn() },
  clientReview: { findUnique: vi.fn(), deleteMany: vi.fn() },
  $queryRawUnsafe: vi.fn(),
  $transaction: vi.fn(),
}))

vi.mock('../../src/lib/prisma.js', () => ({ default: db }))
vi.mock('../../src/infrastructure/transformers/post.transformer.js', () => ({
  toDomainPost: (post: unknown) => post,
}))

import { findAvailablePosts, findEmergencyPosts, findPostById, searchByDistance, updatePost } from '../../src/infrastructure/database/post.database.js'

const expired = new Date(Date.now() - 60_000)
const future = new Date(Date.now() + 60_000)

const posts = [
  { id: 'normal', type: PostType.Post, isEmergency: false, status: 'Active', emergencyExpiresAt: null },
  { id: 'fresh', type: PostType.Emergency, isEmergency: true, status: 'Active', emergencyExpiresAt: future },
  { id: 'expired', type: PostType.Emergency, isEmergency: true, status: 'Active', emergencyExpiresAt: expired },
  { id: 'legacy-expired', type: PostType.Post, isEmergency: true, status: 'Active', emergencyExpiresAt: expired },
  { id: 'hired', type: PostType.Emergency, isEmergency: true, status: 'In progress', emergencyExpiresAt: expired },
  { id: 'completed', type: PostType.Emergency, isEmergency: true, status: 'Completed', emergencyExpiresAt: expired },
]
const applications = [
  { id: 'hired-app', postId: 'hired', status: 'Accepted' },
  { id: 'completed-app', postId: 'completed', status: 'Completed' },
]
const reviews = [{ id: 'completed-review', applicationId: 'completed-app', rating: 5 }]

type PostWhere = {
  status?: string
  type?: string | { in: string[] }
  isEmergency?: boolean
  emergencyExpiresAt?: { gt: Date }
  OR?: PostWhere[]
}

// Interpret the generated Prisma filter against in-memory records. No database connection is opened.
function matchesWhere(post: typeof posts[number], where: PostWhere): boolean {
  if (where.status && where.status !== post.status) return false
  if (where.type && (typeof where.type === 'string' ? where.type !== post.type : !where.type.in.includes(post.type))) return false
  if (where.isEmergency !== undefined && where.isEmergency !== post.isEmergency) return false
  if (where.emergencyExpiresAt?.gt && !(post.emergencyExpiresAt && post.emergencyExpiresAt > where.emergencyExpiresAt.gt)) return false
  if (where.OR && !where.OR.some((branch) => matchesWhere(post, branch))) return false
  return true
}

beforeEach(() => {
  vi.clearAllMocks()
  db.post.findMany.mockImplementation(async ({ where }: { where: PostWhere }) => posts.filter((post) => matchesWhere(post, where)))
  db.post.count.mockImplementation(async ({ where }: { where: PostWhere }) => posts.filter((post) => matchesWhere(post, where)).length)
  db.post.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => posts.find((p) => p.id === where.id) ?? null)
  db.application.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => applications.find((a) => a.id === where.id) ?? null)
  db.workerReview.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => reviews.find((r) => r.id === where.id) ?? null)
  db.$queryRawUnsafe.mockResolvedValue([])
  db.$transaction.mockImplementation(async (callback: (tx: typeof db) => Promise<unknown>) => callback(db))
  db.post.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...posts[0], ...data }))
})

describe('non-destructive emergency expiration', () => {
  it('expires emergencies at the boundary, without expiring ordinary posts', () => {
    const now = new Date('2026-10-23T12:00:00.000Z')
    expect(isExpiredEmergency({ type: PostType.Emergency, isEmergency: true, emergencyExpiresAt: now }, now)).toBe(true)
    expect(isExpiredEmergency({ type: PostType.Emergency, isEmergency: true, emergencyExpiresAt: null }, now)).toBe(true)
    expect(isExpiredEmergency({ type: PostType.Post, isEmergency: false, emergencyExpiresAt: null }, now)).toBe(false)
    expect(isExpiredEmergency({ type: PostType.Emergency, isEmergency: true, emergencyExpiresAt: future }, now)).toBe(false)
  })

  it('lists current emergencies and normal posts, but excludes expired ones from posts and totals', async () => {
    const result = await findAvailablePosts()
    expect(result.posts.map((post) => post.id)).toEqual(['normal', 'fresh'])
    expect(result.total).toBe(2)
    expect(db.post.deleteMany).not.toHaveBeenCalled()
    expect(db.post.updateMany).not.toHaveBeenCalled()
  })

  it('filters the emergency-only list without deleting any post', async () => {
    const result = await findEmergencyPosts()
    expect(result.map((post) => post.id)).toEqual(['fresh'])
    expect(db.post.deleteMany).not.toHaveBeenCalled()
  })

  it('keeps completed and hired emergencies through repeated reads', async () => {
    await findAvailablePosts()
    await findEmergencyPosts()
    await findAvailablePosts()

    expect((await findPostById('completed'))?.status).toBe('Completed')
    expect((await findPostById('hired'))?.status).toBe('In progress')
    expect(await db.application.findUnique({ where: { id: 'hired-app' } })).toMatchObject({ status: 'Accepted', postId: 'hired' })
    expect(await db.application.findUnique({ where: { id: 'completed-app' } })).toMatchObject({ status: 'Completed', postId: 'completed' })
    expect(await db.workerReview.findUnique({ where: { id: 'completed-review' } })).toMatchObject({ applicationId: 'completed-app', rating: 5 })
    expect(posts).toHaveLength(6)
    expect(db.post.deleteMany).not.toHaveBeenCalled()
    expect(db.post.updateMany).not.toHaveBeenCalled()
    expect(db.application.deleteMany).not.toHaveBeenCalled()
    expect(db.application.updateMany).not.toHaveBeenCalled()
    expect(db.workerReview.deleteMany).not.toHaveBeenCalled()
    expect(db.clientReview.deleteMany).not.toHaveBeenCalled()
  })

  it('filters expired emergencies in distance search without writing to the database', async () => {
    await searchByDistance(-34.6, -58.4, 10)
    const [sql, ...params] = db.$queryRawUnsafe.mock.calls[0] as [string, ...unknown[]]
    expect(sql).toContain('p.emergencyExpiresAt > ?')
    expect(sql).toContain('p.isEmergency = 0')
    expect(params).toContain(PostType.Post)
    expect(params).toContain(PostType.Emergency)
    expect(params.some((value) => value instanceof Date)).toBe(true)
    expect(db.post.deleteMany).not.toHaveBeenCalled()
  })
})

describe('updatePost identity protection', () => {
  it('ignores emergency identity fields supplied by the caller', async () => {
    await updatePost('normal', {
      userId: 'user-1',
      title: 'Edited title',
      description: 'Edited description',
      startDate: new Date('2026-06-02'),
      endDate: new Date('2026-06-16'),
      address: 'Edited address',
      categoryId: 'category-1',
      isEmergency: true,
      type: PostType.Emergency,
      emergencyExpiresAt: expired,
    } as unknown as Parameters<typeof updatePost>[1])

    expect(db.postCategory.deleteMany).toHaveBeenCalledWith({ where: { postId: 'normal' } })
    expect(db.postCategory.create).toHaveBeenCalledWith({ data: { postId: 'normal', categoryId: 'category-1' } })
    expect(db.post.update).toHaveBeenCalledWith({
      where: { id: 'normal' },
      data: {
        title: 'Edited title',
        description: 'Edited description',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        address: 'Edited address',
      },
      select: expect.any(Object),
    })
  })
})
