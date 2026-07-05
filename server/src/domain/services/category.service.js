import { listCategories as listCategoriesDB } from '../../infrastructure/database/category.database.js';
export const listCategories = () => listCategoriesDB();
