import { findAllWorkers, findWorkerById, updateWorker } from '../../infrastructure/database/worker.database.js';
import { findReviewsByWorkerId } from '../../infrastructure/database/review.database.js';
import { deleteImage } from '../../infrastructure/providers/cloudinary.provider.js';
const CLOUDINARY_URL_RE = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
export const listWorkers = () => findAllWorkers();
export const getWorker = async (id) => {
    const worker = await findWorkerById(id);
    if (!worker) {
        throw Object.assign(new Error('Worker not found'), { status: 404 });
    }
    return worker;
};
export const updateWorkerProfile = async (id, input) => {
    if (input.photo !== undefined) {
        const current = await findWorkerById(id);
        if (current?.photo && current.photo !== input.photo && CLOUDINARY_URL_RE.test(current.photo)) {
            await deleteImage(current.photo).catch(() => { });
        }
    }
    return updateWorker(id, input);
};
export const getWorkerReviews = async (id) => {
    await getWorker(id);
    return findReviewsByWorkerId(id);
};
