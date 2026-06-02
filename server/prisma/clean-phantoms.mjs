import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const phantoms = await prisma.user.findMany({
    where: { email: { endsWith: '@auth0.local' } },
    select: { id: true, email: true, role: true, createdAt: true },
  })

  if (phantoms.length === 0) {
    console.log('No phantom users found.')
    return
  }

  console.log(`Found ${phantoms.length} phantom users:`)
  for (const u of phantoms) {
    console.log(`  - ${u.email} (role: ${u.role}, created: ${u.createdAt})`)
  }

  const ids = phantoms.map((u) => u.id)
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
  console.log(`Deleted ${ids.length} phantom users.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
}).finally(() => prisma.$disconnect())
