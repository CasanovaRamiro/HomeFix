import prisma from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import { PostInput } from "../types/postInput.js";

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

export const createPost = (
  data: PostInput,
) =>
  prisma.post.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      address: data.address,

      categories: {
        create: {
          categoryId: data.categoryId,
        },
      },
    },
    select: postFields,
  });

export const findPostsByUser = (userId: number) =>
  prisma.post.findMany({
    where: {
      userId,
      status: { in: ["Active", "Paused"] },
    },
    include: {
      categories: {
        include: { category: true },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });