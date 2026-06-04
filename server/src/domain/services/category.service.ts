import { listCategories as listCategoriesDB } from '../../infrastructure/database/category.database.js'
import type { DomainCategory } from '../types/category.types.js'

export const listCategories = (): Promise<DomainCategory[]> => listCategoriesDB()
