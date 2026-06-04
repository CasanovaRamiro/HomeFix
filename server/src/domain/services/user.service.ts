import { findAll } from '../../infrastructure/database/user.database.js'

export const listUsers = () => findAll()
