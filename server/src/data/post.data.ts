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
};

export const findPostsByUser = async (userId: string): Promise<UserPostSummary[]> => {
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

export const updatePostStatus = (id: string, status: string) =>
  prisma.post.update({
    where: { id },
    data: { status },
    select: postFields,
  })
