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
  status: true
} satisfies Prisma.PostSelect;

export const create = (
  data: Omit<PostInput, 'categoryId'> & { userId: number },
  categoryId: number
) => prisma.post.create({ 

  data: {
    ...data,
    categories: {create: {categoryId}}
  },
  select: postFields
 });
