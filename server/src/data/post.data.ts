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

const postListInclude = {
  user: { select: { id: true, name: true } },
  categories: { include: { category: { select: { id: true, name: true } } } },
} satisfies Prisma.PostInclude;

const postDetailInclude = {
  user: { select: { id: true, name: true, phone: true } },
  categories: { include: { category: { select: { id: true, name: true } } } },
  images: { select: { id: true, url: true } },
} satisfies Prisma.PostInclude;

export const createPost = (data: PostInput) =>
  prisma.post.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      address: data.address,
      categories: {
        create: { categoryId: data.categoryId },
      },
    },
    select: postFields,
  });

export const findAllActivePosts = () =>
  prisma.post.findMany({
    where: { status: "Active" },
    include: postListInclude,
    orderBy: { createdAt: "desc" },
  });

export const findPostById = (id: number) =>
  prisma.post.findUnique({
    where: { id },
    include: postDetailInclude,
  });