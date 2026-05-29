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

export const findPostById = (id: string) =>
  prisma.post.findUnique({
    where: { id },
    select: {
      ...postFields,
      createdAt: true,
      categories: {
        select: {
          category: {
            select: { id: true, name: true },
          },
        },
      },
      user: {
        select: { id: true, name: true, phone: true },
      },
      images: {
        select: { url: true },
      },
    },
  });

export type UserPostSummary = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  address: string;
  startDate: Date;
  endDate: Date;
  categories: { id: string; name: string }[];
  worker: { id: string; name: string } | null;
};

export const findPostsByUser = async (userId: string): Promise<UserPostSummary[]> => {
  const posts = await prisma.post.findMany({
    where: { userId, status: { in: ["Active", "In progress", "Paused", "Completed"] } },
    include: {
      categories: { include: { category: true } },
      applications: {
        include: { worker: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
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
    worker: post.applications[0]?.worker ?? null,
  }));
};

export const updatePostStatus = (id: string, status: string) =>
  prisma.post.update({
    where: { id },
    data: { status },
    select: postFields,
  })
