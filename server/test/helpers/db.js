import prisma from '../../src/lib/prisma.js'

export { prisma }

export const cleanDb = () => prisma.user.deleteMany()
