import { describe, it, expect, beforeEach } from 'vitest'
import { cleanDb, createUser, prisma } from '../helpers/db.js'
import { countClientPosts, findCompletedPostsWithApps } from '../../src/infrastructure/database/clientStats.database.js'
import { PostStatus } from '../../src/domain/types/postStatus.js'
import { ApplicationStatus } from '../../src/domain/types/applicationStatus.js'

let clientId: string
let otherClientId: string

beforeEach(async () => {
  await cleanDb()
  const client = await createUser('client@test.com', 'Client', 'hashed')
  const other = await createUser('other@test.com', 'Other', 'hashed')
  clientId = client.id
  otherClientId = other.id
})

const makePost = (userId: string, status: string) =>
  prisma.post.create({
    data: {
      userId,
      title: 'Test Post',
      description: 'Description',
      address: 'Calle 123',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-15'),
      status,
    },
  })

describe('countClientPosts', () => {
  it('returns 0 when user has no posts', async () => {
    const result = await countClientPosts(clientId, PostStatus.Completed)
    expect(result).toBe(0)
  })

  it('counts completed posts', async () => {
    await makePost(clientId, PostStatus.Completed)
    await makePost(clientId, PostStatus.Completed)

    const result = await countClientPosts(clientId, PostStatus.Completed)
    expect(result).toBe(2)
  })

  it('counts cancelled posts', async () => {
    await makePost(clientId, PostStatus.Cancelled)

    const result = await countClientPosts(clientId, PostStatus.Cancelled)
    expect(result).toBe(1)
  })

  it('does not count posts with different status', async () => {
    await makePost(clientId, PostStatus.Active)

    const result = await countClientPosts(clientId, PostStatus.Completed)
    expect(result).toBe(0)
  })

  it('does not count posts from other users', async () => {
    await makePost(otherClientId, PostStatus.Completed)

    const result = await countClientPosts(clientId, PostStatus.Completed)
    expect(result).toBe(0)
  })
})

describe('findCompletedPostsWithApps', () => {
  it('returns empty array when user has no completed posts', async () => {
    const result = await findCompletedPostsWithApps(clientId)
    expect(result).toEqual([])
  })

  it('returns completed posts with applications', async () => {
    const post = await makePost(clientId, PostStatus.Completed)
    await prisma.application.create({
      data: { workerId: clientId, postId: post.id, status: ApplicationStatus.Accepted },
    })

    const result = await findCompletedPostsWithApps(clientId)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(post.id)
    expect(result[0].applications).toHaveLength(1)
  })

  it('does not return non-completed posts', async () => {
    await makePost(clientId, PostStatus.Active)
    await makePost(clientId, PostStatus.Cancelled)

    const result = await findCompletedPostsWithApps(clientId)
    expect(result).toEqual([])
  })

  it('only includes applications with Accepted or Completed status', async () => {
    const post = await makePost(clientId, PostStatus.Completed)
    await prisma.application.create({
      data: { workerId: clientId, postId: post.id, status: ApplicationStatus.Pending },
    })

    const result = await findCompletedPostsWithApps(clientId)
    expect(result[0].applications).toHaveLength(0)
  })

  it('includes review data when application has a review', async () => {
    const post = await makePost(clientId, PostStatus.Completed)
    const app = await prisma.application.create({
      data: { workerId: clientId, postId: post.id, status: ApplicationStatus.Accepted },
    })
    await prisma.workerReview.create({
      data: { applicationId: app.id, reviewerId: clientId, workerId: clientId, rating: 4, description: 'Good' },
    })

    const result = await findCompletedPostsWithApps(clientId)
    expect(result[0].applications[0].review).not.toBeNull()
    expect(result[0].applications[0].review!.id).toBeDefined()
  })

  it('does not return posts from other users', async () => {
    await makePost(otherClientId, PostStatus.Completed)

    const result = await findCompletedPostsWithApps(clientId)
    expect(result).toEqual([])
  })
})
