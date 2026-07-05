import prisma from '../../lib/prisma.js';
import { PostStatus } from '../../domain/types/postStatus.js';
import { toDomainClientProfileBase } from '../transformers/clientProfile.transformer.js';
const clientProfileFields = {
    id: true,
    name: true,
    surname: true,
    email: true,
    phone: true,
    bio: true,
    role: true,
    photo: true,
    createdAt: true,
    address: {
        select: { street: true, number: true, city: true, state: true },
    },
};
export const findClientProfileById = async (id) => {
    const raw = await prisma.user.findUnique({ where: { id }, select: clientProfileFields });
    return raw ? toDomainClientProfileBase(raw) : null;
};
export const updateClientProfile = async (id, input) => {
    const raw = await prisma.user.update({
        where: { id },
        data: input,
        select: clientProfileFields,
    });
    return toDomainClientProfileBase(raw);
};
export const countCompletedPostsByClientId = (id) => prisma.post.count({ where: { userId: id, status: PostStatus.Completed } });
