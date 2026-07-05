import prisma from '../../lib/prisma.js';
import { PostStatus } from '../../domain/types/postStatus.js';
import { ApplicationStatus } from '../../domain/types/applicationStatus.js';
export const findHistoryPostsByUser = async (userId, skip, take) => {
    const where = {
        userId,
        status: { in: [PostStatus.Completed, PostStatus.Cancelled] },
    };
    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where,
            include: {
                categories: { include: { category: true } },
                applications: {
                    where: { status: { in: [ApplicationStatus.Accepted, ApplicationStatus.Completed] } },
                    include: {
                        worker: { select: { id: true, name: true } },
                        review: { select: { id: true } },
                    },
                    take: 1,
                },
                _count: { select: { applications: true } },
            },
            orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
            skip,
            take,
        }),
        prisma.post.count({ where }),
    ]);
    const mapped = posts.map((post) => ({
        id: post.id,
        title: post.title,
        description: post.description,
        status: post.status,
        createdAt: post.createdAt,
        address: post.address,
        startDate: post.startDate,
        endDate: post.endDate,
        categories: post.categories.map((pc) => ({
            id: pc.category.id,
            name: pc.category.name,
        })),
        worker: post.applications[0]?.worker ?? null,
        applicantCount: post._count.applications,
        hasReview: post.applications.some((a) => a.review !== null),
        isEmergency: post.isEmergency ?? false,
        emergencyExpiresAt: post.emergencyExpiresAt ?? null,
    }));
    return { posts: mapped, total };
};
