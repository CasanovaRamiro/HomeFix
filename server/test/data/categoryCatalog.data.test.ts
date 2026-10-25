import { beforeEach, describe, expect, it } from 'vitest'
import { initializeCategoryCatalog } from '../../prisma/categoryCatalog.js'
import { cleanDb, createUser, prisma } from '../helpers/db.js'
import { listCategories } from '../../src/infrastructure/database/category.database.js'
import { UserRole } from '../../src/domain/types/userRole.js'

beforeEach(() => cleanDb())

describe('category catalog initialization with MySQL', () => {
  it('makes trades available on a new database', async () => {
    expect(await initializeCategoryCatalog(prisma)).toBe(8)
    const categories = await listCategories()
    expect(categories).toHaveLength(8)
    expect(categories.map((category) => category.name)).toContain('Electricidad')
    expect(categories.every((category) => category.id.length > 0)).toBe(true)
  })

  it('can run repeatedly without duplicates or changing category IDs', async () => {
    await initializeCategoryCatalog(prisma)
    const before = await listCategories()

    expect(await initializeCategoryCatalog(prisma)).toBe(0)
    expect(await listCategories()).toEqual(before)
  })

  it('preserves accounts, posts, custom categories and their relationships', async () => {
    const existing = await prisma.category.create({ data: { name: 'Electricidad' } })
    const custom = await prisma.category.create({ data: { name: 'Jardinería' } })
    const worker = await createUser('catalog@test.com', 'Existing worker', 'hashed', { role: UserRole.Worker })
    const userCategory = await prisma.userCategory.create({ data: { userId: worker.id, categoryId: existing.id } })
    const post = await prisma.post.create({
      data: {
        userId: worker.id, title: 'Existing post', description: 'Preserve this post', address: 'Test street',
        startDate: new Date('2030-01-01'), endDate: new Date('2030-01-02'),
        categories: { create: { categoryId: custom.id } },
      },
    })

    expect(await initializeCategoryCatalog(prisma)).toBe(7)

    expect(await prisma.user.findUnique({ where: { id: worker.id } })).toEqual(worker)
    expect(await prisma.post.findUnique({ where: { id: post.id } })).toEqual(post)
    expect(await prisma.userCategory.findUnique({ where: { id: userCategory.id } })).toEqual(userCategory)
    expect(await prisma.postCategory.findFirst({ where: { postId: post.id } })).toMatchObject({ categoryId: custom.id })
    expect(await prisma.category.findUnique({ where: { id: existing.id } })).toEqual(existing)
    expect(await prisma.category.findUnique({ where: { id: custom.id } })).toEqual(custom)
    expect(await listCategories()).toHaveLength(9)
  })
})
