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
  createdAt: true,
  image: true,
  categories: {
    select: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.PostSelect;

export type PostWithCategories = Prisma.PostGetPayload<{ select: typeof postFields }>;

const availablePostWhere = (category?: string): Prisma.PostWhereInput => ({
  status: "Active",
  ...(category?.trim()
    ? {
        categories: {
          some: {
            category: {
              name: category.trim(),
            },
          },
        },
      }
    : {}),
});

export const findAvailablePosts = (category?: string): Promise<PostWithCategories[]> =>
  prisma.post.findMany({
    where: availablePostWhere(category),
    orderBy: { createdAt: "desc" },
    select: postFields,
  });

export const findPostById = (id: number): Promise<PostWithCategories | null> =>
  prisma.post.findUnique({
    where: { id },
    select: postFields,
  });
