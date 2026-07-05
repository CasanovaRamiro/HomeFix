import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { cleanDb, createCategory } from '../helpers/db.js';
beforeEach(() => cleanDb());
describe('GET /categories', () => {
    it('responds 200 and returns categories ordered by name', async () => {
        await createCategory('Zulu');
        await createCategory('Alpha');
        await createCategory('Charlie');
        const res = await request(app).get('/categories');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(3);
        expect(res.body[0].name).toBe('Alpha');
        expect(res.body[1].name).toBe('Charlie');
        expect(res.body[2].name).toBe('Zulu');
    });
    it('responds 200 with empty array when no categories', async () => {
        const res = await request(app).get('/categories');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });
    it('returns categories with id and name fields', async () => {
        await createCategory('Plumbing');
        const res = await request(app).get('/categories');
        expect(res.status).toBe(200);
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0].name).toBe('Plumbing');
    });
});
