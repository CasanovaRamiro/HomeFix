import { beforeEach, describe, expect, it, vi } from 'vitest';
const { findUniqueMock, findManyMock, createMock, findFirstMock, upsertNationalIdMock, upsertAddressMock, clientFindManyMock, clientAggregateMock, workerFindManyMock, workerAggregateMock, userUpdateMock, userCategoryCreateManyMock } = vi.hoisted(() => ({
    findUniqueMock: vi.fn(),
    findManyMock: vi.fn(),
    createMock: vi.fn(),
    findFirstMock: vi.fn(),
    upsertNationalIdMock: vi.fn(),
    upsertAddressMock: vi.fn(),
    clientFindManyMock: vi.fn(),
    clientAggregateMock: vi.fn(),
    workerFindManyMock: vi.fn(),
    workerAggregateMock: vi.fn(),
    userUpdateMock: vi.fn(),
    userCategoryCreateManyMock: vi.fn(),
}));
vi.mock('../../src/lib/prisma.js', () => ({
    default: {
        user: {
            findUnique: findUniqueMock,
            findMany: findManyMock,
            create: createMock,
            update: userUpdateMock,
        },
        nationalIdType: {
            findFirst: findFirstMock,
            upsert: upsertNationalIdMock,
        },
        address: {
            upsert: upsertAddressMock,
        },
        clientReview: {
            findMany: clientFindManyMock,
            aggregate: clientAggregateMock,
        },
        workerReview: {
            findMany: workerFindManyMock,
            aggregate: workerAggregateMock,
        },
        userCategory: {
            createMany: userCategoryCreateManyMock,
        },
    },
}));
import { findByEmail, findAll, createUser, findClientReviewsByUserId, findWorkerReviewsByUserId, getWorkerReviewAggregate, getClientReviewAggregate, addUserCategories, updateEmergencyNotifications, updateUserByEmail, updateUserKycStatus } from '../../src/infrastructure/database/user.database.js';
const mockUser = {
    id: 1,
    name: 'Jane',
    surname: 'Test',
    email: 'jane@test.com',
    password: 'hashed',
    nationalId: 'DNI-12345678',
    phone: null,
    role: 'user',
    active: true,
    deleted: false,
    profilePicture: null,
    createdAt: new Date(),
    nationalIdTypeId: 'uuid-type',
    addressId: 'uuid-addr',
};
const publicUser = {
    id: 1,
    name: 'Jane',
    email: 'jane@test.com',
    phone: null,
    role: 'user',
    createdAt: mockUser.createdAt,
};
beforeEach(() => {
    vi.clearAllMocks();
});
describe('findByEmail', () => {
    it('returns the user when the email exists', async () => {
        findUniqueMock.mockResolvedValue(mockUser);
        const user = await findByEmail('jane@test.com');
        expect(findUniqueMock).toHaveBeenCalledWith({ where: { email: 'jane@test.com' } });
        expect(user).not.toBeNull();
        expect(user.email).toBe('jane@test.com');
    });
    it('returns null when the email does not exist', async () => {
        findUniqueMock.mockResolvedValue(null);
        const user = await findByEmail('nobody@test.com');
        expect(user).toBeNull();
    });
});
describe('findAll', () => {
    it('returns all users without the password field', async () => {
        findManyMock.mockResolvedValue([publicUser, { ...publicUser, id: 2, name: 'John', email: 'john@test.com' }]);
        const users = await findAll();
        expect(findManyMock).toHaveBeenCalledOnce();
        expect(users).toHaveLength(2);
        users.forEach((u) => expect(u).not.toHaveProperty('password'));
    });
});
describe('createUser', () => {
    it('inserts the user and returns it without the password field', async () => {
        upsertNationalIdMock.mockResolvedValue({ id: 'default-dni-id', description: 'DNI' });
        upsertAddressMock.mockResolvedValue({ id: 'default-addr-id', street: '', number: '0', city: '', state: '' });
        createMock.mockResolvedValue(publicUser);
        const user = await createUser({
            name: 'Jane',
            email: 'jane@test.com',
            password: 'hashed',
            nationalId: 'DNI-87654321',
        });
        expect(createMock).toHaveBeenCalledOnce();
        expect(user.id).toBeDefined();
        expect(user.email).toBe('jane@test.com');
        expect(user).not.toHaveProperty('password');
    });
});
const mockClientReview = {
    id: 'client-review-1',
    rating: 4,
    description: 'Great client',
    createdAt: new Date('2026-06-01'),
    reviewer: { id: 'worker-1', name: 'Worker One' },
    client: { id: 'client-1', name: 'Client One' },
};
const mockWorkerReview = {
    id: 'worker-review-1',
    rating: 5,
    description: 'Excellent work',
    mediaUrls: null,
    createdAt: new Date('2026-06-01'),
    reviewer: { id: 'client-1', name: 'Client One' },
    application: {
        postId: 'post-1',
        post: { id: 'post-1', title: 'Fix pipes' },
    },
};
const userId = 'client-1';
describe('findClientReviewsByUserId', () => {
    it('returns client reviews for the given user', async () => {
        clientFindManyMock.mockResolvedValue([mockClientReview]);
        const reviews = await findClientReviewsByUserId(userId);
        expect(clientFindManyMock).toHaveBeenCalledWith({
            where: { clientId: userId },
            select: expect.any(Object),
            orderBy: { createdAt: 'desc' },
        });
        expect(reviews).toHaveLength(1);
        expect(reviews[0].id).toBe('client-review-1');
        expect(reviews[0].rating).toBe(4);
        expect(reviews[0].reviewer.name).toBe('Worker One');
        expect(reviews[0].client.name).toBe('Client One');
        expect(reviews[0].createdAt).toBeInstanceOf(Date);
    });
    it('returns an empty array when the user has no client reviews', async () => {
        clientFindManyMock.mockResolvedValue([]);
        const reviews = await findClientReviewsByUserId('no-reviews-user');
        expect(reviews).toEqual([]);
    });
});
describe('findWorkerReviewsByUserId', () => {
    it('returns worker reviews for the given user', async () => {
        workerFindManyMock.mockResolvedValue([mockWorkerReview]);
        const reviews = await findWorkerReviewsByUserId(userId);
        expect(workerFindManyMock).toHaveBeenCalledWith({
            where: { workerId: userId },
            select: expect.any(Object),
            orderBy: { createdAt: 'desc' },
        });
        expect(reviews).toHaveLength(1);
        expect(reviews[0].id).toBe('worker-review-1');
        expect(reviews[0].rating).toBe(5);
        expect(reviews[0].reviewer.name).toBe('Client One');
        expect(reviews[0].application.post.title).toBe('Fix pipes');
        expect(reviews[0].createdAt).toBeInstanceOf(Date);
    });
    it('returns an empty array when the user has no worker reviews', async () => {
        workerFindManyMock.mockResolvedValue([]);
        const reviews = await findWorkerReviewsByUserId('no-reviews-user');
        expect(reviews).toEqual([]);
    });
});
describe('getWorkerReviewAggregate', () => {
    it('returns aggregate data for worker reviews', async () => {
        const mockResult = { _avg: { rating: 4.5 }, _count: 2 };
        workerAggregateMock.mockResolvedValue(mockResult);
        const result = await getWorkerReviewAggregate(userId);
        expect(workerAggregateMock).toHaveBeenCalledWith({ where: { workerId: userId }, _avg: { rating: true }, _count: true });
        expect(result._avg.rating).toBe(4.5);
        expect(result._count).toBe(2);
    });
    it('returns null rating and zero count when no reviews exist', async () => {
        workerAggregateMock.mockResolvedValue({ _avg: { rating: null }, _count: 0 });
        const result = await getWorkerReviewAggregate('no-reviews-user');
        expect(result._avg.rating).toBeNull();
        expect(result._count).toBe(0);
    });
});
describe('getClientReviewAggregate', () => {
    it('returns aggregate data for client reviews', async () => {
        clientAggregateMock.mockResolvedValue({ _avg: { rating: 3.5 }, _count: 1 });
        const result = await getClientReviewAggregate(userId);
        expect(clientAggregateMock).toHaveBeenCalledWith({ where: { clientId: userId }, _avg: { rating: true }, _count: true });
        expect(result._avg.rating).toBe(3.5);
        expect(result._count).toBe(1);
    });
    it('returns null rating and zero count when no reviews exist', async () => {
        clientAggregateMock.mockResolvedValue({ _avg: { rating: null }, _count: 0 });
        const result = await getClientReviewAggregate('no-reviews-user');
        expect(result._avg.rating).toBeNull();
        expect(result._count).toBe(0);
    });
});
describe('addUserCategories', () => {
    it('calls createMany with the correct data', async () => {
        userCategoryCreateManyMock.mockResolvedValue({ count: 2 });
        await addUserCategories('user-1', ['cat-1', 'cat-2']);
        expect(userCategoryCreateManyMock).toHaveBeenCalledWith({
            data: [
                { userId: 'user-1', categoryId: 'cat-1' },
                { userId: 'user-1', categoryId: 'cat-2' },
            ],
        });
    });
    it('returns the result from createMany', async () => {
        const mockResult = { count: 3 };
        userCategoryCreateManyMock.mockResolvedValue(mockResult);
        const result = await addUserCategories('user-1', ['a', 'b', 'c']);
        expect(result).toEqual(mockResult);
    });
});
describe('updateEmergencyNotifications', () => {
    it('calls user.update with enabled: true', async () => {
        userUpdateMock.mockResolvedValue({ id: 'user-1', emergenciesEnabled: true });
        const result = await updateEmergencyNotifications('user-1', true);
        expect(userUpdateMock).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: { emergenciesEnabled: true },
            select: { id: true, emergenciesEnabled: true },
        });
        expect(result).toEqual({ id: 'user-1', emergenciesEnabled: true });
    });
    it('calls user.update with enabled: false', async () => {
        userUpdateMock.mockResolvedValue({ id: 'user-1', emergenciesEnabled: false });
        await updateEmergencyNotifications('user-1', false);
        expect(userUpdateMock).toHaveBeenCalledWith(expect.objectContaining({
            data: { emergenciesEnabled: false },
        }));
    });
});
describe('updateUserByEmail', () => {
    it('calls user.update with the provided fields', async () => {
        const mockResult = { id: 'u1', name: 'New Name', email: 'new@test.com', phone: null, role: 'user', createdAt: new Date(), photo: null };
        userUpdateMock.mockResolvedValue(mockResult);
        const result = await updateUserByEmail('old@test.com', { name: 'New Name', email: 'new@test.com' });
        expect(userUpdateMock).toHaveBeenCalledWith({
            where: { email: 'old@test.com' },
            data: { name: 'New Name', email: 'new@test.com' },
            select: expect.any(Object),
        });
        expect(result).toEqual(mockResult);
    });
    it('can update only the role field', async () => {
        userUpdateMock.mockResolvedValue({ id: 'u1', name: 'User', email: 'u@test.com', phone: null, role: 'worker', createdAt: new Date(), photo: null });
        await updateUserByEmail('u@test.com', { role: 'worker' });
        expect(userUpdateMock).toHaveBeenCalledWith(expect.objectContaining({
            data: { role: 'worker' },
        }));
    });
});
describe('updateUserKycStatus', () => {
    it('calls user.update with kycStatus and related fields', async () => {
        const now = new Date();
        const mockResult = {
            id: 'u1', name: 'User', email: 'u@test.com', phone: null, role: 'user', createdAt: now, photo: null,
            kycStatus: 'approved', kycVerifiedAt: now, diditVerificationId: 'did-123',
        };
        userUpdateMock.mockResolvedValue(mockResult);
        const result = await updateUserKycStatus('u@test.com', {
            kycStatus: 'approved',
            kycVerifiedAt: now,
            diditVerificationId: 'did-123',
        });
        expect(userUpdateMock).toHaveBeenCalledWith({
            where: { email: 'u@test.com' },
            data: { kycStatus: 'approved', kycVerifiedAt: now, diditVerificationId: 'did-123' },
            select: expect.any(Object),
        });
        expect(result).toEqual(mockResult);
    });
    it('can set kycVerifiedAt and diditVerificationId to null', async () => {
        userUpdateMock.mockResolvedValue({ id: 'u1', name: 'U', email: 'u@test.com', phone: null, role: 'user', createdAt: new Date(), photo: null, kycStatus: 'pending', kycVerifiedAt: null, diditVerificationId: null });
        await updateUserKycStatus('u@test.com', { kycStatus: 'pending', kycVerifiedAt: null, diditVerificationId: null });
        expect(userUpdateMock).toHaveBeenCalledWith(expect.objectContaining({
            data: { kycStatus: 'pending', kycVerifiedAt: null, diditVerificationId: null },
        }));
    });
});
