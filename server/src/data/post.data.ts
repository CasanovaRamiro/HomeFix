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

type PostResult = Prisma.PostGetPayload<{ select: typeof postFields }>

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
  })


export const findPostById = (id: number): Promise<PostResult | null> =>
  prisma.post.findUnique({
    where: { id },
    select: postFields,
  })


export const updatePostStatus = (id: number, status: string): Promise<PostResult> =>
  prisma.post.update({
    where: { id },
    data: { status },
    select: postFields,
  });