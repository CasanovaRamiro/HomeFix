import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { findByEmail, createUser } from '../data/user.data.js'

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

export const register = async ({ name, email, password, phone }) => {
  const existing = await findByEmail(email)
  if (existing) throw new Error('Email already in use')
  const hashed = await bcrypt.hash(password, 10)
  const user = await createUser({ name, email, password: hashed, phone })
  return { token: signToken(user.id), user }
}

export const login = async ({ email, password }) => {
  const user = await findByEmail(email)
  if (!user) throw new Error('Invalid credentials')
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw new Error('Invalid credentials')
  const { password: _, ...safeUser } = user
  return { token: signToken(safeUser.id), user: safeUser }
}
