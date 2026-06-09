import { Prisma } from "@prisma/client";
import prisma from "../../src/lib/prisma.js";

export { prisma };

export const cleanDb = async () => {
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.workerReview.deleteMany();
  await prisma.clientReview.deleteMany();

  await prisma.userCategory.deleteMany();
  await prisma.postCategory.deleteMany();
  await prisma.post.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.address.deleteMany();
  await prisma.nationalIdType.deleteMany();
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;
};

const createUserDependencies = async () => {
  const nationalIdType = await prisma.nationalIdType.create({
    data: { description: `DNI-${Date.now()}-${Math.random()}` },
  });
  const address = await prisma.address.create({
    data: {
      street: "Test street",
      number: "123",
      city: "Test city",
      state: "Test state",
    },
  });

  return { nationalIdType, address };
};

export const createUser = async (
  email: string,
  name: string,
  password: string,
  extra: Record<string, unknown> = {},
) => {
  const { nationalIdType, address } = await createUserDependencies();

  return await prisma.user.create({
    data: {
      email,
      name,
      password,
      surname: "Test",
      nationalId: `${Math.floor(10000000 + Math.random() * 90000000)}`,
      nationalIdTypeId: nationalIdType.id,
      addressId: address.id,
      ...extra,
    } as unknown as Prisma.UserCreateInput,
  });
};

export const createCategory = async (name: string) => {
  return await prisma.category.create({
    data: { name },
  });
};
