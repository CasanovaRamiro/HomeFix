import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCreateSubcontractBody } from '../../src/presentation/middleware/subcontract.middleware.js';
function createReq(body) {
    return { body };
}
let req;
let res;
let next;
let statusMock;
let jsonMock;
const validBody = {
    parentPostId: 'parent-123',
    positions: [
        { categoryId: 'cat-1', quantity: 2, roleDescription: 'Albañilería general' },
        { categoryId: 'cat-2', quantity: 1, roleDescription: 'Instalación eléctrica' },
    ],
};
beforeEach(() => {
    req = createReq(validBody);
    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn().mockReturnThis();
    res = { status: statusMock, json: jsonMock };
    next = vi.fn();
});
describe('validateCreateSubcontractBody', () => {
    it('should call next when input is valid with parentPostId', () => {
        validateCreateSubcontractBody(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(statusMock).not.toHaveBeenCalled();
    });
    it('should call next when input is valid without parentPostId', () => {
        req.body = {
            startDate: '2026-08-01',
            endDate: '2026-08-15',
            address: 'Calle 123',
            positions: [{ categoryId: 'cat-1', quantity: 1, roleDescription: 'Pintura' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(statusMock).not.toHaveBeenCalled();
    });
    it('should return 400 when positions is not an array', () => {
        req.body = { parentPostId: 'parent-123', positions: 'not-array' };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'At least one position is required' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when positions is empty', () => {
        req.body = { parentPostId: 'parent-123', positions: [] };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'At least one position is required' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when positions is missing', () => {
        req.body = { parentPostId: 'parent-123' };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'At least one position is required' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when a position has no categoryId', () => {
        req.body = {
            parentPostId: 'parent-123',
            positions: [{ quantity: 2, roleDescription: 'Test' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Position 1: categoryId is required' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when a position has empty categoryId', () => {
        req.body = {
            parentPostId: 'parent-123',
            positions: [{ categoryId: '', quantity: 2, roleDescription: 'Test' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Position 1: categoryId is required' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when a position has quantity 0', () => {
        req.body = {
            parentPostId: 'parent-123',
            positions: [{ categoryId: 'cat-1', quantity: 0, roleDescription: 'Test' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Position 1: quantity must be a positive integer' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when a position has negative quantity', () => {
        req.body = {
            parentPostId: 'parent-123',
            positions: [{ categoryId: 'cat-1', quantity: -1, roleDescription: 'Test' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Position 1: quantity must be a positive integer' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when a position has non-integer quantity', () => {
        req.body = {
            parentPostId: 'parent-123',
            positions: [{ categoryId: 'cat-1', quantity: 1.5, roleDescription: 'Test' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Position 1: quantity must be a positive integer' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when a position has no roleDescription', () => {
        req.body = {
            parentPostId: 'parent-123',
            positions: [{ categoryId: 'cat-1', quantity: 2 }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Position 1: roleDescription is required' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when a position has empty roleDescription', () => {
        req.body = {
            parentPostId: 'parent-123',
            positions: [{ categoryId: 'cat-1', quantity: 2, roleDescription: '' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Position 1: roleDescription is required' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when no parentPostId and startDate is missing', () => {
        req.body = {
            endDate: '2026-08-15',
            address: 'Calle 123',
            positions: [{ categoryId: 'cat-1', quantity: 1, roleDescription: 'Pintura' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'startDate is required when no parentPostId is provided' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when no parentPostId and startDate is empty', () => {
        req.body = {
            startDate: '',
            endDate: '2026-08-15',
            address: 'Calle 123',
            positions: [{ categoryId: 'cat-1', quantity: 1, roleDescription: 'Pintura' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'startDate is required when no parentPostId is provided' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when no parentPostId and startDate is invalid', () => {
        req.body = {
            startDate: 'not-a-date',
            endDate: '2026-08-15',
            address: 'Calle 123',
            positions: [{ categoryId: 'cat-1', quantity: 1, roleDescription: 'Pintura' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'startDate must be a valid date' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when no parentPostId and endDate is missing', () => {
        req.body = {
            startDate: '2026-08-01',
            address: 'Calle 123',
            positions: [{ categoryId: 'cat-1', quantity: 1, roleDescription: 'Pintura' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'endDate is required when no parentPostId is provided' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when no parentPostId and endDate is invalid', () => {
        req.body = {
            startDate: '2026-08-01',
            endDate: 'bad-date',
            address: 'Calle 123',
            positions: [{ categoryId: 'cat-1', quantity: 1, roleDescription: 'Pintura' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'endDate must be a valid date' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when no parentPostId and endDate is before startDate', () => {
        req.body = {
            startDate: '2026-08-15',
            endDate: '2026-08-01',
            address: 'Calle 123',
            positions: [{ categoryId: 'cat-1', quantity: 1, roleDescription: 'Pintura' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'endDate must be after startDate' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when no parentPostId and address is missing', () => {
        req.body = {
            startDate: '2026-08-01',
            endDate: '2026-08-15',
            positions: [{ categoryId: 'cat-1', quantity: 1, roleDescription: 'Pintura' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'address is required when no parentPostId is provided' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 when no parentPostId and address is empty', () => {
        req.body = {
            startDate: '2026-08-01',
            endDate: '2026-08-15',
            address: '',
            positions: [{ categoryId: 'cat-1', quantity: 1, roleDescription: 'Pintura' }],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'address is required when no parentPostId is provided' });
        expect(next).not.toHaveBeenCalled();
    });
    it('should return 400 on first invalid position and stop further checks', () => {
        req.body = {
            parentPostId: 'parent-123',
            positions: [
                { categoryId: 'cat-1', quantity: 1, roleDescription: '' },
                { categoryId: '', quantity: 0, roleDescription: 'test' },
            ],
        };
        validateCreateSubcontractBody(req, res, next);
        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({ error: 'Position 1: roleDescription is required' });
        expect(next).not.toHaveBeenCalled();
    });
});
