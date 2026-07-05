import { Router } from 'express';
import { jwtCheck } from '../middleware/auth0.middleware.js';
import { syncAuth0User } from '../../domain/services/auth.service.js';
import { getWorkerDashboard } from '../../domain/services/workerDashboard.service.js';
const router = Router();
router.use(jwtCheck);
router.get('/', async (req, res, next) => {
    try {
        const claims = req.auth?.payload;
        const user = await syncAuth0User(claims);
        const dashboard = await getWorkerDashboard(user.id);
        res.json(dashboard);
    }
    catch (err) {
        next(err);
    }
});
export default router;
