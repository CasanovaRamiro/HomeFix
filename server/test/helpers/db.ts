import { Prisma } from "@prisma/client";
import prisma from "../../src/lib/prisma.js";
import { assertTestDbIdentity } from "./testDbSafety.js";

export { prisma };

export const cleanDb = async (): Promise<void> => {
  await assertTestDbIdentity(prisma);
  await prisma.$transaction(async (tx) => {
    // Recheck on the transaction's actual connection before its first write.
    await assertTestDbIdentity(tx);
    await tx.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;
    try {
      await tx.workerReview.deleteMany();
      await tx.clientReview.deleteMany();
      await tx.application.deleteMany();
      await tx.jobApplication.deleteMany();
      await tx.postImage.deleteMany();
      await tx.telegramLinkCode.deleteMany();
      await tx.userCategory.deleteMany();
      await tx.postCategory.deleteMany();
      await tx.post.deleteMany();
      await tx.category.deleteMany();
      await tx.user.deleteMany();
      await tx.address.deleteMany();
      await tx.nationalIdType.deleteMany();
    } finally {
      await tx.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
    }
  });
};

const createUserDependencies = async () => {
  await assertTestDbIdentity(prisma);
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
  await assertTestDbIdentity(prisma);
  return await prisma.category.create({
    data: { name },
  });
};
