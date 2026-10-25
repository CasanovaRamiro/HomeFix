import { beforeEach, describe, expect, it } from 'vitest'
import { cleanDb, createCategory, createUser, prisma } from '../helpers/db.js'
import { createSubPost, updateSubcontractGroup } from '../../src/infrastructure/database/post.database.js'

const updateData = (positions: { id?: string; categoryId: string; quantity: number; roleDescription: string }[]) => ({
  title: 'Updated subcontract',
  description: 'Updated description',
  startDate: new Date('2026-06-01T00:00:00.000Z'),
  endDate: new Date('2026-06-15T00:00:00.000Z'),
  address: 'Updated address',
  latitude: -34.6,
  longitude: -58.4,
  positions,
})

describe('updateSubcontractGroup', () => {
  let userId: string

  beforeEach(async () => {
    await cleanDb()
    userId = (await createUser('subcontract-edit@test.com', 'Owner', 'hashed')).id
  })

  const createGroup = async (count: number) => {
    const groupId = `group-${Date.now()}-${Math.random()}`
    const posts = []
    for (let index = 0; index < count; index++) {
      const category = await createCategory(`Category-${Date.now()}-${index}-${Math.random()}`)
      posts.push(await createSubPost({
        userId,
        subcontractGroupId: groupId,
        title: `Position ${index}`,
        description: 'Description',
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2026-06-15T00:00:00.000Z'),
        address: 'Address',
        positions: [{ categoryId: category.id, quantity: 2, roleDescription: `Role ${index}` }],
      }))
    }
    return { groupId, posts }
  }

  const positionOf = (post: Awaited<ReturnType<typeof createSubPost>>, overrides = {}) => ({
    id: post.categories[0].id,
    categoryId: post.categories[0].categoryId!,
    quantity: post.categories[0].quantity!,
    roleDescription: post.categories[0].roleDescription!,
    ...overrides,
  })

  it('keeps exactly two positions and their IDs when unchanged', async () => {
    const { groupId, posts } = await createGroup(2)
    await prisma.postCategory.update({ where: { id: posts[0].categories[0].id }, data: { filledCount: 1 } })
    await prisma.postCategory.update({ where: { id: posts[1].categories[0].id }, data: { filledCount: 2 } })
    const before = posts.map((post) => positionOf(post))

    await updateSubcontractGroup(groupId, updateData(before))

    const after = await prisma.post.findMany({
      where: { subcontractGroupId: groupId },
      select: { id: true, categories: { select: { id: true, filledCount: true } } },
    })
    expect(after).toHaveLength(2)
    expect(after.flatMap((post) => post.categories.map((category) => category.id))).toEqual(expect.arrayContaining(before.map((position) => position.id)))
    expect(after.flatMap((post) => post.categories.map((category) => category.filledCount))).toEqual(expect.arrayContaining([1, 2]))
  })

  it('updates only the identified position when positions are reordered', async () => {
    const { groupId, posts } = await createGroup(2)
    const first = positionOf(posts[0], { roleDescription: 'First updated', quantity: 3 })
    const second = positionOf(posts[1], { roleDescription: 'Second updated', quantity: 4 })

    await updateSubcontractGroup(groupId, updateData([second, first]))

    const categories = await prisma.postCategory.findMany({ where: { id: { in: [first.id, second.id] } } })
    expect(categories.find((category) => category.id === first.id)).toMatchObject({ quantity: 3, roleDescription: 'First updated' })
    expect(categories.find((category) => category.id === second.id)).toMatchObject({ quantity: 4, roleDescription: 'Second updated' })
  })

  it('creates only one new position when one is added', async () => {
    const { groupId, posts } = await createGroup(2)
    const category = await createCategory('Added category')

    await updateSubcontractGroup(groupId, updateData([
      positionOf(posts[0]),
      positionOf(posts[1]),
      { categoryId: category.id, quantity: 1, roleDescription: 'Added role' },
    ]))

    expect(await prisma.post.count({ where: { subcontractGroupId: groupId } })).toBe(3)
    expect(await prisma.postCategory.count({ where: { category: { name: 'Added category' }, post: { subcontractGroupId: groupId } } })).toBe(1)
  })

  it('removes one free position without affecting the remaining one', async () => {
    const { groupId, posts } = await createGroup(2)

    await updateSubcontractGroup(groupId, updateData([positionOf(posts[0])]))

    expect(await prisma.post.count({ where: { subcontractGroupId: groupId } })).toBe(1)
    expect(await prisma.postCategory.findUnique({ where: { id: posts[0].categories[0].id } })).not.toBeNull()
  })

  it('rejects removing a position with applications without changing the group', async () => {
    const { groupId, posts } = await createGroup(2)
    const worker = await createUser('worker@test.com', 'Worker', 'hashed', { role: 'worker' })
    await prisma.application.create({
      data: { workerId: worker.id, postId: posts[1].id, categoryId: posts[1].categories[0].id },
    })

    await expect(updateSubcontractGroup(groupId, updateData([positionOf(posts[0])]))).rejects.toMatchObject({ status: 400 })
    expect(await prisma.post.count({ where: { subcontractGroupId: groupId } })).toBe(2)
  })

  it('rejects reducing quantity below filledCount', async () => {
    const { groupId, posts } = await createGroup(2)
    await prisma.postCategory.update({ where: { id: posts[0].categories[0].id }, data: { filledCount: 2 } })

    await expect(updateSubcontractGroup(groupId, updateData([positionOf(posts[0], { quantity: 1 }), positionOf(posts[1])]))).rejects.toMatchObject({ status: 400 })
    expect((await prisma.postCategory.findUnique({ where: { id: posts[0].categories[0].id } }))?.filledCount).toBe(2)
  })

  it('rejects foreign and duplicate position IDs', async () => {
    const { groupId, posts } = await createGroup(2)
    const first = positionOf(posts[0])
    const second = positionOf(posts[1])

    await expect(updateSubcontractGroup(groupId, updateData([{ ...first, id: 'foreign-id' }, second]))).rejects.toMatchObject({ status: 400 })
    await expect(updateSubcontractGroup(groupId, updateData([first, { ...second, id: first.id }]))).rejects.toMatchObject({ status: 400 })
  })

  it('rolls back all changes when a later new position fails', async () => {
    const { groupId, posts } = await createGroup(2)
    const before = await prisma.post.findMany({ where: { subcontractGroupId: groupId }, select: { id: true, title: true } })

    await expect(updateSubcontractGroup(groupId, updateData([
      positionOf(posts[0], { roleDescription: 'Changed before failure' }),
      { categoryId: 'missing-category', quantity: 1, roleDescription: 'Invalid new position' },
    ]))).rejects.toThrow()

    expect(await prisma.post.findMany({ where: { subcontractGroupId: groupId }, select: { id: true, title: true } })).toEqual(before)
    expect((await prisma.postCategory.findUnique({ where: { id: posts[0].categories[0].id } }))?.roleDescription).toBe('Role 0')
  })
})
