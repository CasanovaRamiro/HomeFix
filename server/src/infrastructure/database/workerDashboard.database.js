import prisma from '../../lib/prisma.js';
import { UserRole } from '../../domain/types/userRole.js';
export const findWorkerProfile = async (workerId) => {
    const raw = await prisma.user.findFirst({
        where: { id: workerId, role: UserRole.Worker },
        select: {
            id: true,
            name: true,
            surname: true,
            email: true,
            phone: true,
            bio: true,
            photo: true,
            role: true,
            emergenciesEnabled: true,
            createdAt: true,
            address: {
                select: { street: true, number: true, city: true, state: true },
            },
            categories: {
                select: {
                    category: { select: { id: true, name: true } },
                },
            },
        },
    });
    if (!raw)
        return null;
    return {
        id: raw.id,
        name: raw.name,
        surname: raw.surname,
        email: raw.email,
        phone: raw.phone,
        bio: raw.bio,
        photo: raw.photo,
        createdAt: raw.createdAt,
        emergenciesEnabled: raw.emergenciesEnabled,
        location: raw.address ? `${raw.address.city}, ${raw.address.state}` : null,
        categories: raw.categories.map((c) => c.category),
    };
};
export const countWorkerReviews = async (workerId) => {
    const result = await prisma.workerReview.aggregate({
        where: { workerId },
        _count: true,
        _avg: { rating: true },
    });
    return {
        count: result._count,
        avgRating: result._avg.rating ?? 0,
    };
};
export const countWorkerApplications = (workerId) => prisma.application.groupBy({
    by: ['status'],
    where: { workerId },
    _count: true,
});
export const countNewJobsForWorker = async (workerCategoryIds) => {
    if (workerCategoryIds.length === 0)
        return 0;
    return prisma.post.count({
        where: {
            status: 'Active',
            categories: {
                some: { categoryId: { in: workerCategoryIds } },
            },
        },
    });
};
export const countCompletedJobs = (workerId) => prisma.application.count({
    where: { workerId, status: 'Completed' },
});
