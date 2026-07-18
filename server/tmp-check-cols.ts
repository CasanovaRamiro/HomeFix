import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

const userCols = await p.$queryRawUnsafe<{ COLUMN_NAME: string }[]>(
  "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'HomeFix_db' AND TABLE_NAME = 'User' ORDER BY ORDINAL_POSITION"
)
console.log('User columns:', userCols.map(c => c.COLUMN_NAME).join(', '))

await p.$disconnect()
