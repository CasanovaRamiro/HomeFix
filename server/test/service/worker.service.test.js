import { describe, it, expect, vi, beforeEach } from 'vitest';
vi.mock('../../src/infrastructure/database/worker.database.js', () => ({
    findAllWorkers: vi.fn(),
    findWorkerById: vi.fn(),
    updateWorker: vi.fn(),
}));
vi.mock('../../src/infrastructure/database/review.database.js', () => ({
    findReviewsByWorkerId: vi.fn(),
}));
vi.mock('../../src/infrastructure/providers/cloudinary.provider.js', () => ({
    deleteImage: vi.fn(),
}));
import * as workerData from '../../src/infrastructure/database/worker.database.js';
import * as reviewData from '../../src/infrastructure/database/review.database.js';
import * as cloudinary from '../../src/infrastructure/providers/cloudinary.provider.js';
import { listWorkers, getWorker, updateWorkerProfile, getWorkerReviews } from '../../src/domain/services/worker.service.js';
import { UserRole } from '../../src/domain/types/userRole.js';
const mockWorker = {
    id: 'uuid-worker-1',
    name: 'Ana',
    email: 'ana@test.com',
    phone: null,
    bio: null,
    role: UserRole.Worker,
    photo: null,
    availability: [],
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    categories: [{ id: 'uuid-category-1', name: 'Plumbing' }],
    certificates: [],
    gallery: [],
    emergenciesEnabled: true,
};
beforeEach(() => vi.clearAllMocks());
describe('worker.service - listWorkers', () => {
    it('returns all workers from the data layer', async () => {
        vi.mocked(workerData.findAllWorkers).mockResolvedValue([mockWorker]);
        const result = await listWorkers();
        expect(workerData.findAllWorkers).toHaveBeenCalledTimes(1);
        expect(result).toEqual([mockWorker]);
    });
    it('returns an empty array when there are no workers', async () => {
        vi.mocked(workerData.findAllWorkers).mockResolvedValue([]);
        const result = await listWorkers();
        expect(result).toEqual([]);
    });
});
describe('worker.service - getWorker', () => {
    it('returns the worker when found', async () => {
        vi.mocked(workerData.findWorkerById).mockResolvedValue(mockWorker);
        const result = await getWorker('uuid-worker-1');
        expect(workerData.findWorkerById).toHaveBeenCalledWith('uuid-worker-1');
        expect(result).toEqual(mockWorker);
    });
    it('throws when the worker does not exist', async () => {
        vi.mocked(workerData.findWorkerById).mockResolvedValue(null);
        await expect(getWorker('non-existent-id')).rejects.toThrow('Worker not found');
    });
});
describe('worker.service - updateWorkerProfile', () => {
    it('updates worker without touching photo when photo is not in input', async () => {
        vi.mocked(workerData.updateWorker).mockResolvedValue({ ...mockWorker, bio: 'Updated bio' });
        const result = await updateWorkerProfile('uuid-worker-1', { bio: 'Updated bio' });
        expect(workerData.findWorkerById).not.toHaveBeenCalled();
        expect(cloudinary.deleteImage).not.toHaveBeenCalled();
        expect(workerData.updateWorker).toHaveBeenCalledWith('uuid-worker-1', { bio: 'Updated bio' });
        expect(result.bio).toBe('Updated bio');
    });
    it('deletes old Cloudinary image when photo is replaced with a new one', async () => {
        const oldPhoto = 'https://res.cloudinary.com/demo/image/upload/v123/samples/old.jpg';
        vi.mocked(workerData.findWorkerById).mockResolvedValue({ ...mockWorker, photo: oldPhoto });
        vi.mocked(workerData.updateWorker).mockResolvedValue({ ...mockWorker, photo: 'https://res.cloudinary.com/demo/image/upload/v123/samples/new.jpg' });
        vi.mocked(cloudinary.deleteImage).mockResolvedValue(undefined);
        await updateWorkerProfile('uuid-worker-1', { photo: 'https://res.cloudinary.com/demo/image/upload/v123/samples/new.jpg' });
        expect(cloudinary.deleteImage).toHaveBeenCalledWith(oldPhoto);
    });
    it('skips delete when old photo is not a Cloudinary URL', async () => {
        vi.mocked(workerData.findWorkerById).mockResolvedValue({ ...mockWorker, photo: 'https://example.com/photo.jpg' });
        vi.mocked(workerData.updateWorker).mockResolvedValue({ ...mockWorker, photo: 'https://res.cloudinary.com/demo/image/upload/v123/new.jpg' });
        await updateWorkerProfile('uuid-worker-1', { photo: 'https://res.cloudinary.com/demo/image/upload/v123/new.jpg' });
        expect(cloudinary.deleteImage).not.toHaveBeenCalled();
    });
    it('skips delete when worker has no current photo', async () => {
        vi.mocked(workerData.findWorkerById).mockResolvedValue({ ...mockWorker, photo: null });
        vi.mocked(workerData.updateWorker).mockResolvedValue({ ...mockWorker, photo: 'https://res.cloudinary.com/demo/image/upload/v123/new.jpg' });
        await updateWorkerProfile('uuid-worker-1', { photo: 'https://res.cloudinary.com/demo/image/upload/v123/new.jpg' });
        expect(cloudinary.deleteImage).not.toHaveBeenCalled();
    });
});
describe('worker.service - getWorkerReviews', () => {
    const mockReviews = [
        {
            id: 'review-1',
            rating: 5,
            description: 'Excellent',
            mediaUrls: null,
            createdAt: new Date('2024-01-01'),
            reviewer: { id: 'client-1', name: 'Client' },
            application: { postId: 'post-1', post: { id: 'post-1', title: 'Fix pipes' } },
        },
    ];
    it('returns reviews for an existing worker', async () => {
        vi.mocked(workerData.findWorkerById).mockResolvedValue(mockWorker);
        vi.mocked(reviewData.findReviewsByWorkerId).mockResolvedValue(mockReviews);
        const result = await getWorkerReviews('uuid-worker-1');
        expect(workerData.findWorkerById).toHaveBeenCalledWith('uuid-worker-1');
        expect(reviewData.findReviewsByWorkerId).toHaveBeenCalledWith('uuid-worker-1');
        expect(result).toEqual(mockReviews);
    });
    it('throws 404 when worker does not exist', async () => {
        vi.mocked(workerData.findWorkerById).mockResolvedValue(null);
        await expect(getWorkerReviews('non-existent-id')).rejects.toThrow('Worker not found');
        expect(reviewData.findReviewsByWorkerId).not.toHaveBeenCalled();
    });
});
