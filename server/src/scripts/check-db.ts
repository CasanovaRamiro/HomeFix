import { logger } from '../lib/logger.js'
import prisma from '../lib/prisma.js'

async function main() {
  const users = await prisma.user.findMany({ take: 10 })
  logger.info({ count: users.length, action: 'checkdb' }, 'Users count')
  if (users.length > 0) users.forEach(u => logger.info({ id: u.id, name: u.name, email: u.email, role: u.role, action: 'checkdb' }, `User ${u.id}`))

  const posts = await prisma.post.findMany({ take: 10 })
  logger.info({ count: posts.length, action: 'checkdb' }, 'Posts count')
  if (posts.length > 0) posts.forEach(p => logger.info({ id: p.id, title: p.title, userId: p.userId, action: 'checkdb' }, `Post ${p.id}`))

  const cats = await prisma.category.findMany({ take: 10 })
  logger.info({ count: cats.length, action: 'checkdb' }, 'Categories count')
  if (cats.length > 0) cats.forEach(c => logger.info({ id: c.id, name: c.name, action: 'checkdb' }, `Category ${c.id}`))
}
main().catch(e => logger.error({ err: e, action: 'checkdb' }, 'Error')).finally(() => prisma.$disconnect())
