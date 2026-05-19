import prisma from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

const postFields = {
  id: true,
  userId: true,
  title: true,
  description: true,
  startDate: true,
  endDate: true,
  address: true,
  status: true,
} satisfies Prisma.PostSelect;

export const create = (
  data: Prisma.PostCreateWithoutUserInput & { userId: number },
) => prisma.post.create({ data, select: postFields });
