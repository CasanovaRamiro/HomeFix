import prisma from "../lib/prisma.js";
import type { PostInput } from "../types/postInput.js";

export interface PostWithCategories {
  id: string
  userId: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  address: string
  status: string
  createdAt: Date
  images: { url: string }[]
  latitude: number | null
  longitude: number | null
  categories: {
    category: {
      id: string
      name: string
    }
  }[]
  user: {
    id: string
    name: string
    surname: string | null
  }
}

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
  images: {
    select: { url: true },
  },
  latitude: true,
  longitude: true,
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
  user: {
    select: {
      id: true,
      name: true,
      surname: true,
    },
  },
} as const;

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
  }) as unknown as Promise<PostWithCategories>

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
  }) as unknown as Promise<PostWithCategories[]>;

export const findPostById = (id: string) =>
  prisma.post.findUnique({
    where: { id },
    select: postFields,
  }) as unknown as Promise<PostWithCategories | null>;

export interface LocationSearchResult extends PostWithCategories {
  distance: number
}

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

  return posts.map((post: Awaited<ReturnType<typeof prisma.post.findMany<{ include: { categories: { include: { category: true } }; applications: { include: { worker: { select: { id: true; name: true } } } } } }>>>[number]) => ({
    id: post.id,
    title: post.title,
    description: post.description,
    status: post.status,
    createdAt: post.createdAt,
    address: post.address,
    startDate: post.startDate,
    endDate: post.endDate,
    categories: post.categories.map((pc: { category: { id: string; name: string } }) => ({
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
  })

export const searchByDistance = async (
  lat: number,
  lng: number,
  radiusKm: number,
  category?: string,
): Promise<LocationSearchResult[]> => {
  const hasCategory = !!category?.trim();

  const categoryFilter = hasCategory
    ? `AND EXISTS (
        SELECT 1 FROM PostCategory pc2
        JOIN Category c2 ON c2.id = pc2.categoryId
        WHERE pc2.postId = p.id AND c2.name = ?
      )`
    : '';

  const sql = `
    SELECT p.id,
      (6371 * ACOS(LEAST(GREATEST(
        COS(RADIANS(?)) * COS(RADIANS(p.latitude)) *
        COS(RADIANS(p.longitude) - RADIANS(?)) +
        SIN(RADIANS(?)) * SIN(RADIANS(p.latitude))
      , -1), 1))) AS distance
    FROM Post p
    WHERE p.status = 'Active'
      AND p.latitude IS NOT NULL
      AND p.longitude IS NOT NULL
      ${categoryFilter}
    HAVING distance <= ?
    ORDER BY distance
  `;

  const params: (string | number)[] = [lat, lng, lat];
  if (hasCategory) {
    params.push(category!.trim());
  }
  params.push(radiusKm);

  const rawResults = await prisma.$queryRawUnsafe<{ id: string; distance: number }[]>(sql, ...params);

  if (!Array.isArray(rawResults) || rawResults.length === 0) return [];

  const ids = rawResults.map((r: { id: string; distance: number }) => r.id);
  const distanceMap = new Map(
    rawResults.map((r: { id: string; distance: number }) => [r.id, r.distance] as const)
  );

  const posts = await prisma.post.findMany({
    where: { id: { in: ids } },
    select: postFields,
  });

  const results: (LocationSearchResult | null)[] = posts.map((p: Awaited<ReturnType<typeof prisma.post.findMany<{ select: typeof postFields }>>>[number]) => {
    const dist = distanceMap.get(p.id);
    if (dist === undefined) return null;
    return { ...p, distance: dist } as unknown as LocationSearchResult;
  });

  return results
    .filter((p): p is LocationSearchResult => p !== null)
    .sort((a, b) => a.distance - b.distance);
};
