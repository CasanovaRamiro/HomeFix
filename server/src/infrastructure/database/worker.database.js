import prisma from '../../lib/prisma.js';
import { UserRole } from '../../domain/types/userRole.js';
import { toDomainWorker } from '../transformers/worker.transformer.js';
const workerFields = {
    id: true,
    name: true,
    email: true,
    phone: true,
    bio: true,
    role: true,
    photo: true,
    availability: true,
    certificates: true,
    gallery: true,
    emergenciesEnabled: true,
    createdAt: true,
    categories: {
        select: {
            category: {
                select: { id: true, name: true },
            },
        },
    },
};
export const findWorkerById = async (id) => {
    const raw = await prisma.user.findFirst({
        where: { id, role: UserRole.Worker },
        select: workerFields,
    });
    if (!raw)
        return null;
    return toDomainWorker(raw);
};
export const updateWorker = async (id, input) => {
    const { categoryIds, availability, certificates, gallery, ...data } = input;
    const serialized = {};
    if (availability !== undefined)
        serialized.availability = JSON.stringify(availability);
    if (certificates !== undefined)
        serialized.certificates = JSON.stringify(certificates);
    if (gallery !== undefined)
        serialized.gallery = JSON.stringify(gallery);
    const raw = await prisma.user.update({
        where: { id },
        data: {
            ...data,
            ...serialized,
            ...(categoryIds
                ? {
                    categories: {
                        deleteMany: {},
                        create: categoryIds.map((categoryId) => ({ categoryId })),
                    },
                }
                : {}),
        },
        select: workerFields,
    });
    return toDomainWorker(raw);
};
export const findAllWorkers = async () => {
    const raw = await prisma.user.findMany({
        where: { role: UserRole.Worker },
        select: workerFields,
    });
    return raw.map((w) => toDomainWorker(w));
};
