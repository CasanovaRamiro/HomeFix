import { findAll, findClientReviewsByUserId, findWorkerReviewsByUserId, getWorkerReviewAggregate, getClientReviewAggregate, updateEmergencyNotifications } from '../../infrastructure/database/user.database.js';
import { UserRole } from '../types/userRole.js';
export const listUsers = () => findAll();
export const getUserReviews = (userId, as) => {
    if (as === UserRole.Client)
        return findClientReviewsByUserId(userId);
    if (as === UserRole.Worker)
        return findWorkerReviewsByUserId(userId);
    return Promise.resolve([]);
};
export const getClientRating = async (userId) => {
    const agg = await getClientReviewAggregate(userId);
    const averageRating = agg._count > 0 ? Math.round((agg._avg.rating ?? 0) * 10) / 10 : 0;
    return { averageRating, reviewCount: agg._count };
};
export const getWorkerRating = async (userId) => {
    const agg = await getWorkerReviewAggregate(userId);
    const averageRating = agg._count > 0 ? Math.round((agg._avg.rating ?? 0) * 10) / 10 : 0;
    return { averageRating, reviewCount: agg._count };
};
export const getUserRating = async (userId) => {
    const [workerAgg, clientAgg] = await Promise.all([
        getWorkerReviewAggregate(userId),
        getClientReviewAggregate(userId),
    ]);
    const totalCount = workerAgg._count + clientAgg._count;
    const workerTotal = (workerAgg._avg.rating ?? 0) * workerAgg._count;
    const clientTotal = (clientAgg._avg.rating ?? 0) * clientAgg._count;
    const averageRating = totalCount > 0 ? Math.round(((workerTotal + clientTotal) / totalCount) * 10) / 10 : 0;
    return { averageRating, reviewCount: totalCount };
};
export const setEmergencyNotifications = (userId, enabled) => updateEmergencyNotifications(userId, enabled);
