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

export type UserPostSummary = {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  address: string;
  startDate: Date;
  endDate: Date;
  categories: { id: number; name: string }[];
};

export const findPostsByUser = async (userId: number): Promise<UserPostSummary[]> => {
  const posts = await prisma.post.findMany({
    where: { userId, status: { in: ["Active", "Paused"] } },
    include: { categories: { include: { category: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    description: post.description,
    status: post.status,
    createdAt: post.createdAt,
    address: post.address,
    startDate: post.startDate,
    endDate: post.endDate,
    categories: post.categories.map((pc) => ({
      id: pc.category.id,
      name: pc.category.name,
    })),
  }));
};