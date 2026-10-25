import { beforeEach, describe, expect, it } from 'vitest'
import { cleanDb, createCategory, createUser, prisma } from '../helpers/db.js'
import { createSubPost, incrementPostFilledCount } from '../../src/infrastructure/database/post.database.js'
import { acceptApplication, dismissWorker } from '../../src/domain/services/application.service.js'

describe('application acceptance vacancy writes', () => {
  let postId: string
  let firstCategoryId: string
  let secondCategoryId: string

  beforeEach(async () => {
    await cleanDb()
    const owner = await createUser(`owner-${Date.now()}@test.com`, 'Owner', 'hashed')
    const firstCategory = await createCategory(`First-${Date.now()}`)
    const secondCategory = await createCategory(`Second-${Date.now()}`)
    const post = await createSubPost({
      userId: owner.id,
      title: 'Concurrent subcontract',
      description: 'Test',
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-06-15T00:00:00.000Z'),
      address: 'Test address',
      positions: [
        { categoryId: firstCategory.id, quantity: 1, roleDescription: 'First' },
        { categoryId: secondCategory.id, quantity: 1, roleDescription: 'Second' },
      ],
    })

    postId = post.id
    firstCategoryId = post.categories.find((category) => category.name === firstCategory.name)!.id
    secondCategoryId = post.categories.find((category) => category.name === secondCategory.name)!.id
  })

  it('allows only one concurrent increment for the last vacancy', async () => {
    const results = await Promise.all([
      incrementPostFilledCount(postId, firstCategoryId),
      incrementPostFilledCount(postId, firstCategoryId),
    ])

    expect(results.map((result) => result.count).sort()).toEqual([0, 1])
    await expect(prisma.postCategory.findUnique({ where: { id: firstCategoryId } }))
      .resolves.toMatchObject({ filledCount: 1, quantity: 1 })
  })

  it('keeps category vacancy counters independent', async () => {
    const results = await Promise.all([
      incrementPostFilledCount(postId, firstCategoryId),
      incrementPostFilledCount(postId, secondCategoryId),
    ])

    expect(results).toEqual([{ count: 1 }, { count: 1 }])
    const categories = await prisma.postCategory.findMany({ where: { postId }, orderBy: { id: 'asc' } })
    expect(categories).toHaveLength(2)
    expect(categories.every((category) => category.filledCount === 1)).toBe(true)
  })

  it('accepts only one of two concurrent applications for the last vacancy', async () => {
    const owner = await prisma.post.findUniqueOrThrow({ where: { id: postId }, select: { userId: true } })
    const workerOne = await createUser(`worker-one-${Date.now()}@test.com`, 'Worker one', 'hashed')
    const workerTwo = await createUser(`worker-two-${Date.now()}@test.com`, 'Worker two', 'hashed')
    const applications = await Promise.all([
      prisma.application.create({ data: { workerId: workerOne.id, postId, categoryId: firstCategoryId } }),
      prisma.application.create({ data: { workerId: workerTwo.id, postId, categoryId: firstCategoryId } }),
    ])

    const results = await Promise.allSettled(
      applications.map((application) => acceptApplication(owner.userId, application.id)),
    )

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    await expect(prisma.postCategory.findUnique({ where: { id: firstCategoryId } }))
      .resolves.toMatchObject({ filledCount: 1, quantity: 1 })
    await expect(prisma.application.count({ where: { postId, status: 'Accepted' } })).resolves.toBe(1)
    await expect(prisma.application.count({ where: { postId, status: 'Pending' } })).resolves.toBe(1)
  })

  it('accepts a single application only once under duplicate requests', async () => {
    const owner = await prisma.post.findUniqueOrThrow({ where: { id: postId }, select: { userId: true } })
    const worker = await createUser(`duplicate-worker-${Date.now()}@test.com`, 'Duplicate worker', 'hashed')
    const application = await prisma.application.create({
      data: { workerId: worker.id, postId, categoryId: firstCategoryId },
    })

    const results = await Promise.allSettled([
      acceptApplication(owner.userId, application.id),
      acceptApplication(owner.userId, application.id),
    ])

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    await expect(prisma.application.findUnique({ where: { id: application.id } }))
      .resolves.toMatchObject({ status: 'Accepted' })
    await expect(prisma.postCategory.findUnique({ where: { id: firstCategoryId } }))
      .resolves.toMatchObject({ filledCount: 1 })
  })

  it('dismisses once and rolls back a repeated concurrent dismissal', async () => {
    const owner = await prisma.post.findUniqueOrThrow({ where: { id: postId }, select: { userId: true } })
    const worker = await createUser(`dismiss-worker-${Date.now()}@test.com`, 'Dismiss worker', 'hashed')
    const application = await prisma.application.create({
      data: { workerId: worker.id, postId, categoryId: firstCategoryId, status: 'Accepted' },
    })
    await prisma.postCategory.update({ where: { id: firstCategoryId }, data: { filledCount: 1 } })
    await prisma.post.update({ where: { id: postId }, data: { status: 'In progress' } })

    const results = await Promise.allSettled([
      dismissWorker(owner.userId, application.id),
      dismissWorker(owner.userId, application.id),
    ])

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1)
    await expect(prisma.application.findUnique({ where: { id: application.id } }))
      .resolves.toMatchObject({ status: 'Dismissed' })
    await expect(prisma.postCategory.findUnique({ where: { id: firstCategoryId } }))
      .resolves.toMatchObject({ filledCount: 0 })
  })

  it('rolls back dismissal when the occupied cup is already missing', async () => {
    const owner = await prisma.post.findUniqueOrThrow({ where: { id: postId }, select: { userId: true } })
    const worker = await createUser(`rollback-worker-${Date.now()}@test.com`, 'Rollback worker', 'hashed')
    const application = await prisma.application.create({
      data: { workerId: worker.id, postId, categoryId: firstCategoryId, status: 'Accepted' },
    })

    await expect(dismissWorker(owner.userId, application.id)).rejects.toMatchObject({ status: 400 })
    await expect(prisma.application.findUnique({ where: { id: application.id } }))
      .resolves.toMatchObject({ status: 'Accepted' })
    await expect(prisma.postCategory.findUnique({ where: { id: firstCategoryId } }))
      .resolves.toMatchObject({ filledCount: 0 })
  })
})
