const validateRating = (rating, res) => {
    if (rating === undefined || rating === null) {
        res.status(400).json({ error: 'Rating is required' });
        return false;
    }
    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
        return false;
    }
    return true;
};
const validateDescription = (description, res) => {
    if (description !== undefined && description !== null) {
        if (typeof description !== 'string') {
            res.status(400).json({ error: 'Description must be a string' });
            return false;
        }
        if (description.length > 500) {
            res.status(400).json({ error: 'Description must not exceed 500 characters' });
            return false;
        }
    }
    return true;
};
export const validateWorkerReviewBody = (req, res, next) => {
    if (!req.body.postId || typeof req.body.postId !== 'string') {
        res.status(400).json({ error: 'postId is required' });
        return;
    }
    if (!validateRating(req.body.rating, res))
        return;
    if (!validateDescription(req.body.description, res))
        return;
    next();
};
export const validateClientReviewBody = (req, res, next) => {
    if (!req.body.applicationId || typeof req.body.applicationId !== 'string') {
        res.status(400).json({ error: 'applicationId is required' });
        return;
    }
    if (!validateRating(req.body.rating, res))
        return;
    if (!validateDescription(req.body.description, res))
        return;
    next();
};
