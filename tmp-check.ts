import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const cats = await p.category.findMany()
console.log('Categories:', JSON.stringify(cats, null, 2))
await p.$disconnect()
