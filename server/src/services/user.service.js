import prisma from '../lib/prisma.js'

export const listUsers = async () => {
  return prisma.user.findMany({
    include: {
      clientProfile: true,
      workerProfile: true,
      adminProfile: true
    }
  })
}
