import prisma from '../../lib/prisma.js';
const publicFields = {
    id: true,
    name: true,
    email: true,
    phone: true,
    photo: true,
    role: true,
    createdAt: true,
};
export const findByEmail = (email) => prisma.user.findUnique({ where: { email } });
export const findUserById = (id) => prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, telegramChatId: true },
});
export const findAll = () => prisma.user.findMany({ select: publicFields });
const clientReviewFields = {
    id: true,
    rating: true,
    description: true,
    createdAt: true,
    reviewer: { select: { id: true, name: true } },
    client: { select: { id: true, name: true } },
};
const toDomainClientReview = (r) => ({
    id: r.id,
    rating: r.rating,
    description: r.description,
    createdAt: r.createdAt,
    reviewer: r.reviewer,
    client: r.client,
});
const workerReviewFields = {
    id: true,
    rating: true,
    description: true,
    mediaUrls: true,
    createdAt: true,
    reviewer: { select: { id: true, name: true } },
    application: {
        select: {
            postId: true,
            post: { select: { id: true, title: true } },
        },
    },
};
const toDomainWorkerReview = (r) => ({
    id: r.id,
    rating: r.rating,
    description: r.description,
    mediaUrls: r.mediaUrls,
    createdAt: r.createdAt,
    reviewer: r.reviewer,
    application: r.application,
});
export const findClientReviewsByUserId = (userId) => prisma.clientReview
    .findMany({ where: { clientId: userId }, select: clientReviewFields, orderBy: { createdAt: 'desc' } })
    .then((raw) => raw.map(toDomainClientReview));
export const findWorkerReviewsByUserId = (userId) => prisma.workerReview
    .findMany({ where: { workerId: userId }, select: workerReviewFields, orderBy: { createdAt: 'desc' } })
    .then((raw) => raw.map(toDomainWorkerReview));
export const getWorkerReviewAggregate = (userId) => prisma.workerReview.aggregate({
    where: { workerId: userId },
    _avg: { rating: true },
    _count: true,
});
export const getClientReviewAggregate = (userId) => prisma.clientReview.aggregate({
    where: { clientId: userId },
    _avg: { rating: true },
    _count: true,
});
const createDefaultDeps = async () => {
    const dni = await prisma.nationalIdType.upsert({
        where: { id: 'default-dni-id' },
        update: {},
        create: { id: 'default-dni-id', description: 'DNI' },
    });
    const addr = await prisma.address.upsert({
        where: { id: 'default-addr-id' },
        update: {},
        create: { id: 'default-addr-id', street: 'Sin especificar', number: '0', city: 'Buenos Aires', state: 'Buenos Aires' },
    });
    return { dniId: dni.id, addrId: addr.id };
};
export const createUser = async (data) => {
    const { dniId, addrId } = await createDefaultDeps();
    return prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: data.password,
            phone: data.phone ?? null,
            surname: data.surname ?? '',
            nationalId: data.nationalId ?? `${Date.now()}`,
            nationalIdTypeId: dniId,
            addressId: addrId,
            role: data.role ?? 'user',
        },
        select: publicFields,
    });
};
export const addUserCategories = async (userId, categoryIds) => prisma.userCategory.createMany({
    data: categoryIds.map((categoryId) => ({ userId, categoryId })),
});
export const updateEmergencyNotifications = (userId, enabled) => prisma.user.update({
    where: { id: userId },
    data: { emergenciesEnabled: enabled },
    select: { id: true, emergenciesEnabled: true },
});
export const updateUserByEmail = (email, data) => prisma.user.update({
    where: { email },
    data,
    select: publicFields,
});
export const updateUserKycStatus = (email, data) => prisma.user.update({
    where: { email },
    data,
    select: { ...publicFields, kycStatus: true, kycVerifiedAt: true, diditVerificationId: true },
});
