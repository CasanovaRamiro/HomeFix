import { Router } from 'express';
import { createPost, createEmergencyPost, createSubContract, createBidding, getUserPosts, getPostById, getSubcontractById, finalizePost, pausePost, cancelPost, listAvailablePosts, findAvailableSubcontracts, listEmergencyPosts, searchPostsByDistance, completePost, reopenPost, markInProgress, updatePost, getMySubcontractManager, getSubcontractGroupDetail, getBiddingDetail, closeBidding, selectWinner, listAvailableBiddings, getWorkerBiddings, } from '../../domain/services/post.service.js';
import { syncAuth0User } from '../../domain/services/auth.service.js';
import { UserRole } from '../../domain/types/userRole.js';
import { toPostDTO, toUserPostDTO } from '../transformers/post.transformer.js';
import { validateCreateSubcontractBody } from '../middleware/subcontract.middleware.js';
const router = Router();
router.get('/', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        if (user.role !== UserRole.Worker) {
            res.status(403).json({ error: 'Worker access required' });
            return;
        }
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
        const result = await listAvailablePosts(undefined, { page, limit, sortOrder });
        res.json({ ...result, data: result.data.map(toPostDTO) });
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.get('/available', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        if (user.role !== UserRole.Worker) {
            res.status(403).json({ error: 'Worker access required' });
            return;
        }
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
        const result = await listAvailablePosts(category, { page, limit, sortOrder });
        res.json({ ...result, data: result.data.map(toPostDTO) });
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.get('/emergency', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        if (user.role !== UserRole.Worker) {
            res.status(403).json({ error: 'Worker access required' });
            return;
        }
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;
        const result = await listEmergencyPosts(category);
        res.json(result.map(toPostDTO));
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.post('/emergency/create', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        if (!claims?.sub) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const user = await syncAuth0User(claims);
        if (user.role !== UserRole.Client) {
            res.status(403).json({ error: 'Client access required' });
            return;
        }
        const { title, description, categoryId, address, latitude, longitude } = req.body;
        if (!title || !description || !categoryId || !address) {
            res.status(400).json({ error: 'Todos los campos son obligatorios' });
            return;
        }
        const result = await createEmergencyPost({
            userId: user.id,
            title,
            description,
            categoryId,
            address,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
        });
        res.status(201).json(toPostDTO(result));
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.get('/search-location', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        if (user.role !== UserRole.Worker) {
            res.status(403).json({ error: 'Worker access required' });
            return;
        }
        const lat = Number(req.query.lat);
        const lng = Number(req.query.lng);
        const radius = Number(req.query.radius);
        const category = typeof req.query.category === 'string' ? req.query.category : undefined;
        const posts = await searchPostsByDistance(lat, lng, radius, category);
        res.json(posts.map(toPostDTO));
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.get('/availableSubcontracts', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        if (user.role !== UserRole.Worker) {
            res.status(403).json({ error: 'Worker access required' });
            return;
        }
        const result = await findAvailableSubcontracts();
        res.json(result.map(toPostDTO));
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.get('/subcontracts/my-subcontracts', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        if (user.role !== UserRole.Worker) {
            res.status(403).json({ error: 'Worker access required' });
            return;
        }
        const result = await getMySubcontractManager(user.id);
        res.json({
            stats: result.stats,
            subcontracts: result.subcontracts.map(toPostDTO),
        });
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.get('/subcontracts/group/:id', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        if (user.role !== UserRole.Worker) {
            res.status(403).json({ error: 'Worker access required' });
            return;
        }
        const result = await getSubcontractGroupDetail(req.params.id);
        if (!result)
            return res.status(404).json({ error: 'Subcontract group not found' });
        res.json(toPostDTO(result));
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.get('/subcontracts/:id', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        if (user.role !== UserRole.Worker) {
            res.status(403).json({ error: 'Worker access required' });
            return;
        }
        const result = await getSubcontractById(req.params.id);
        if (!result)
            return res.status(404).json({ error: 'Subcontract not found' });
        res.json(toPostDTO(result));
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.post('/create', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        if (!claims?.sub) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const user = await syncAuth0User(claims);
        const result = await createPost({ ...req.body, userId: user.id });
        res.status(201).json(toPostDTO(result));
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.post('/create-bidding', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        if (user.role !== UserRole.Client) {
            res.status(403).json({ error: 'Client access required' });
            return;
        }
        const { title, description, categoryIds, endDate, budgetMax, address, latitude, longitude, materialResponsibility, imageUrls, bidWeights } = req.body;
        if (!title || !categoryIds || !categoryIds.length || !endDate || !address || !materialResponsibility || !bidWeights) {
            res.status(400).json({ error: 'Campos obligatorios faltantes' });
            return;
        }
        const result = await createBidding({
            userId: user.id,
            title,
            description: description || '',
            categoryIds,
            endDate: new Date(endDate),
            budgetMax: budgetMax ?? undefined,
            address,
            latitude: latitude ?? null,
            longitude: longitude ?? null,
            materialResponsibility,
            imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
            bidWeights,
        });
        res.status(201).json(toPostDTO(result));
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.get('/available-biddings', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        const result = await listAvailableBiddings(user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.get('/worker-biddings', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        const result = await getWorkerBiddings(user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.get('/biddings/:id', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        const result = await getBiddingDetail(req.params.id, user.id);
        res.json(toPostDTO(result));
    }
    catch (err) {
        next(err);
    }
});
router.post('/biddings/:id/close', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        const result = await closeBidding(req.params.id, user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.post('/biddings/:id/select-winner', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        const { applicationId } = req.body;
        if (!applicationId) {
            res.status(400).json({ error: 'applicationId is required' });
            return;
        }
        const result = await selectWinner(req.params.id, user.id, applicationId);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.post('/create-subcontract', validateCreateSubcontractBody, async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        const body = req.body;
        const results = await createSubContract({
            ...body,
            userId: user.id,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
        });
        res.status(201).json(results.map(toPostDTO));
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const result = await getPostById(req.params.id);
        if (!result)
            return res.status(404).json({ error: 'Post not found' });
        res.json(toPostDTO(result));
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.post('/user-posts', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        const posts = await getUserPosts(user.id);
        res.json(posts.map(toUserPostDTO));
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
router.patch('/:id/pause', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        const result = await pausePost(req.params.id, user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.patch('/:id/cancel', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        const result = await cancelPost(req.params.id, user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.patch('/:id/finalize', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        const result = await finalizePost(req.params.id, user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.patch('/:id/complete', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        if (!claims?.sub) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const user = await syncAuth0User(claims);
        const result = await completePost(req.params.id, user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.patch('/:id/reopen', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        if (!claims?.sub) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const user = await syncAuth0User(claims);
        const result = await reopenPost(req.params.id, user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.patch('/:id/mark-in-progress', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        if (!claims?.sub) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const user = await syncAuth0User(claims);
        const result = await markInProgress(req.params.id, user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.patch('/:id', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        if (!claims?.sub) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const user = await syncAuth0User(claims);
        const result = await updatePost(req.params.id, user.id, req.body);
        res.json(toPostDTO(result));
    }
    catch (error) {
        const err = error;
        if (!err.status)
            err.status = 400;
        next(err);
    }
});
export default router;
