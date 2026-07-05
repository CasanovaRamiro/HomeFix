import { describe, it, expect, beforeEach } from 'vitest';
import { cleanDb, createUser, prisma } from '../helpers/db.js';
import { findHistoryPostsByUser } from '../../src/infrastructure/database/clientHistory.database.js';
let userId;
let workerId;
beforeEach(async () => {
    await cleanDb();
    const client = await createUser('client@test.com', 'Client', 'hashed');
    const worker = await createUser('worker@test.com', 'Worker', 'hashed');
    userId = client.id;
    workerId = worker.id;
});
const makePost = (overrides = {}) => prisma.post.create({
    data: {
        userId,
        title: 'Test Post',
        description: 'Description',
        address: 'Calle 123',
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2026-06-15T00:00:00.000Z'),
        ...overrides,
    },
});
describe('findHistoryPostsByUser', () => {
    it('retorna lista vacia y total 0 cuando no hay posts', async () => {
        const result = await findHistoryPostsByUser(userId, 0, 10);
        expect(result.posts).toEqual([]);
        expect(result.total).toBe(0);
    });
    it('incluye solo posts Completed y Cancelled', async () => {
        await makePost({ status: 'Active' });
        await makePost({ status: 'In progress' });
        await makePost({ status: 'Completed' });
        await makePost({ status: 'Cancelled' });
        const result = await findHistoryPostsByUser(userId, 0, 10);
        expect(result.posts).toHaveLength(2);
        expect(result.total).toBe(2);
    });
    it('incluye posts Cancelled sin aplicaciones', async () => {
        await makePost({ status: 'Cancelled' });
        const result = await findHistoryPostsByUser(userId, 0, 10);
        expect(result.posts).toHaveLength(1);
        expect(result.posts[0].status).toBe('Cancelled');
    });
    it('devuelve hasReview true cuando existe WorkerReview', async () => {
        const post = await makePost({ status: 'Completed' });
        const application = await prisma.application.create({
            data: { workerId, postId: post.id, status: 'Accepted' },
        });
        await prisma.workerReview.create({
            data: {
                applicationId: application.id,
                reviewerId: userId,
                workerId,
                description: 'Buen trabajo',
                rating: 5,
            },
        });
        const result = await findHistoryPostsByUser(userId, 0, 10);
        expect(result.posts[0].hasReview).toBe(true);
    });
    it('devuelve hasReview false sin WorkerReview', async () => {
        const post = await makePost({ status: 'Completed' });
        await prisma.application.create({
            data: { workerId, postId: post.id, status: 'Accepted' },
        });
        const result = await findHistoryPostsByUser(userId, 0, 10);
        expect(result.posts[0].hasReview).toBe(false);
    });
    it('aplica skip y take correctamente', async () => {
        for (let i = 0; i < 5; i++) {
            await makePost({ status: 'Completed', title: `Post ${i}` });
        }
        const page1 = await findHistoryPostsByUser(userId, 0, 2);
        expect(page1.posts).toHaveLength(2);
        expect(page1.total).toBe(5);
        expect(page1.posts[0].title).toBe('Post 4');
        expect(page1.posts[1].title).toBe('Post 3');
        const page2 = await findHistoryPostsByUser(userId, 2, 2);
        expect(page2.posts).toHaveLength(2);
        expect(page2.total).toBe(5);
        expect(page2.posts[0].title).toBe('Post 2');
        expect(page2.posts[1].title).toBe('Post 1');
    });
    it('solo devuelve posts del userId indicado', async () => {
        const otherUser = await createUser('other@test.com', 'Other', 'hashed');
        await makePost({ status: 'Completed' });
        await prisma.post.create({
            data: {
                userId: otherUser.id,
                title: 'Other Post',
                description: 'Test',
                address: 'Otra calle',
                startDate: new Date('2026-06-01T00:00:00.000Z'),
                endDate: new Date('2026-06-15T00:00:00.000Z'),
                status: 'Completed',
            },
        });
        const result = await findHistoryPostsByUser(userId, 0, 10);
        expect(result.posts).toHaveLength(1);
        expect(result.total).toBe(1);
    });
});
