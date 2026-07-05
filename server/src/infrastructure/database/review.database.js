import prisma from '../../lib/prisma.js';
import { toDomainWorkerReview } from '../transformers/worker.transformer.js';
import { toDomainClientReview } from '../transformers/clientReview.transformer.js';
const reviewFields = {
    id: true,
    rating: true,
    description: true,
    mediaUrls: true,
    createdAt: true,
    reviewer: {
        select: { id: true, name: true },
    },
    application: {
        select: {
            postId: true,
            post: { select: { id: true, title: true } },
        },
    },
};
export const createReview = async (data) => {
    const raw = await prisma.workerReview.create({
        data: {
            applicationId: data.applicationId,
            reviewerId: data.reviewerId,
            workerId: data.workerId,
            rating: data.rating,
            description: data.description ?? '',
            mediaUrls: data.mediaUrls ?? null,
        },
        select: reviewFields,
    });
    return toDomainWorkerReview(raw);
};
export const findWorkerReviewByApplicationId = async (applicationId) => {
    const raw = await prisma.workerReview.findUnique({
        where: { applicationId },
        select: reviewFields,
    });
    return raw ? toDomainWorkerReview(raw) : null;
};
export const findReviewsByWorkerId = async (workerId) => {
    const raw = await prisma.workerReview.findMany({
        where: { workerId },
        select: reviewFields,
        orderBy: { createdAt: 'desc' },
    });
    return raw.map(toDomainWorkerReview);
};
const clientReviewFields = {
    id: true,
    rating: true,
    description: true,
    createdAt: true,
    reviewer: {
        select: { id: true, name: true },
    },
    client: {
        select: { id: true, name: true },
    },
};
export const createClientReview = async (data) => {
    const raw = await prisma.clientReview.create({
        data: {
            applicationId: data.applicationId,
            reviewerId: data.reviewerId,
            clientId: data.clientId,
            rating: data.rating,
            description: data.description ?? '',
        },
        select: clientReviewFields,
    });
    return toDomainClientReview(raw);
};
export const findClientReviewByApplicationId = async (applicationId) => {
    const raw = await prisma.clientReview.findUnique({
        where: { applicationId },
        select: clientReviewFields,
    });
    return raw ? toDomainClientReview(raw) : null;
};
