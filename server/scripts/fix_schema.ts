import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a regular index on (workerId, postId) to serve as a replacement
  await prisma.$executeRawUnsafe('CREATE INDEX `Application_workerId_postId_idx` ON `application`(`workerId`, `postId`)')
  console.log('Created replacement index')

  // Now try to drop the unique index
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE `application` DROP INDEX `Application_workerId_postId_key`')
    console.log('Unique index dropped')
  } catch (e: any) {
    console.log('Failed:', e?.meta?.message || e)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
