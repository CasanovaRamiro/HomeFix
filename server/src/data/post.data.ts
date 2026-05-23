import prisma from "../lib/prisma.js";

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
} as const;

export interface PostWithCategories {
  id: number
  userId: number
  title: string
  description: string
  startDate: Date
  endDate: Date
  address: string
  status: string
  createdAt: Date
  image: string
  categories: {
    category: {
      id: number
      name: string
    }
  }[]
}

const availablePostWhere = (category?: string) => ({
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
