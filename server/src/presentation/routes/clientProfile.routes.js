import { Router } from 'express';
import { getClientProfile, updateClientProfile } from '../../domain/services/clientProfile.service.js';
import { syncAuth0User } from '../../domain/services/auth.service.js';
import { toClientProfileDTO } from '../transformers/clientProfile.transformer.js';
const router = Router();
router.get('/:id', async (req, res, next) => {
    try {
        const profile = await getClientProfile(req.params.id);
        // Contact fields are only returned to the owner.
        let isOwner = false;
        const claims = req.auth?.payload;
        if (claims?.sub) {
            try {
                const authUser = await syncAuth0User(claims);
                isOwner = authUser.id === req.params.id;
            }
            catch {
                isOwner = false;
            }
        }
        res.json(toClientProfileDTO(profile, { includeContact: isOwner }));
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
        let authUser;
        try {
            authUser = await syncAuth0User(claims);
        }
        catch {
            res.status(401).json({ error: 'No encontramos una cuenta con este correo. Por favor registrate primero.' });
            return;
        }
        if (authUser.id !== req.params.id) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        const body = req.body;
        const input = {};
        if (body.name !== undefined)
            input.name = body.name;
        if (body.surname !== undefined)
            input.surname = body.surname;
        if (body.phone !== undefined)
            input.phone = body.phone;
        if (body.bio !== undefined)
            input.bio = body.bio;
        if (body.photo !== undefined)
            input.photo = body.photo;
        const updated = await updateClientProfile(req.params.id, input);
        res.json(toClientProfileDTO(updated, { includeContact: true }));
    }
    catch (err) {
        next(err);
    }
});
export default router;
