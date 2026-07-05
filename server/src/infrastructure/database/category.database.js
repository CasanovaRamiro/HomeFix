import prisma from '../../lib/prisma.js';
export const listCategories = () => prisma.category.findMany({ orderBy: { name: 'asc' } });
export const upsertCategoryByName = (name) => prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
});
