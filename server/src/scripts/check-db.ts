import prisma from '../lib/prisma.js'

async function main() {
  const users = await prisma.user.findMany({ take: 10 })
  console.log('Users count:', users.length)
  if (users.length > 0) users.forEach(u => console.log(`  [${u.id}] ${u.name} (${u.email}) role=${u.role}`))
  
  const posts = await prisma.post.findMany({ take: 10 })
  console.log('Posts count:', posts.length)
  if (posts.length > 0) posts.forEach(p => console.log(`  [${p.id}] ${p.title} by user ${p.userId}`))

  const cats = await prisma.category.findMany({ take: 10 })
  console.log('Categories count:', cats.length)
  if (cats.length > 0) cats.forEach(c => console.log(`  [${c.id}] ${c.name}`))
}
main().catch(e => console.error('Error:', e.message)).finally(() => prisma.$disconnect())
