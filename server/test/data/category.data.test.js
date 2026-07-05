import { describe, it, expect, beforeEach } from 'vitest';
import { cleanDb } from '../helpers/db.js';
import { listCategories, upsertCategoryByName } from '../../src/infrastructure/database/category.database.js';
beforeEach(() => cleanDb());
describe('listCategories', () => {
    it('returns empty array when no categories exist', async () => {
        const result = await listCategories();
        expect(result).toEqual([]);
    });
    it('returns categories sorted by name ascending', async () => {
        await upsertCategoryByName('Plumbing');
        await upsertCategoryByName('Carpentry');
        await upsertCategoryByName('Electrical');
        const result = await listCategories();
        expect(result).toHaveLength(3);
        expect(result.map((c) => c.name)).toEqual(['Carpentry', 'Electrical', 'Plumbing']);
    });
    it('returns id and name for each category', async () => {
        await upsertCategoryByName('Plumbing');
        const result = await listCategories();
        expect(result[0].id).toBeDefined();
        expect(result[0].name).toBe('Plumbing');
    });
});
describe('upsertCategoryByName', () => {
    it('creates a new category when it does not exist', async () => {
        const result = await upsertCategoryByName('Plumbing');
        expect(result.id).toBeDefined();
        expect(result.name).toBe('Plumbing');
    });
    it('returns the existing category when called again with the same name', async () => {
        const first = await upsertCategoryByName('Plumbing');
        const second = await upsertCategoryByName('Plumbing');
        expect(second.id).toBe(first.id);
        expect(second.name).toBe('Plumbing');
    });
    it('does not create duplicate entries', async () => {
        await upsertCategoryByName('Electrical');
        await upsertCategoryByName('Electrical');
        const all = await listCategories();
        expect(all.filter((c) => c.name === 'Electrical')).toHaveLength(1);
    });
});
