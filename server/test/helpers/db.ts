import prisma from "../../src/lib/prisma.js";

export { prisma };

export const cleanDb = async () => {
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
  await prisma.workerReview.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.userCategory.deleteMany();
  await prisma.postCategory.deleteMany();
  await prisma.post.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;
};

export const createUser = async (data: { email: string; name: string; password: string; role?: string }) => {
  return await prisma.user.create({ data });
};

export const createCategory = async (name: string) => {
  return await prisma.category.create({
    data: { name },
  });
};
