import prisma from '../../src/lib/prisma.js'
import { assertTestDbIdentity } from './testDbSafety.js'

await assertTestDbIdentity(prisma)
