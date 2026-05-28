import prisma from "../lib/prisma.js";

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
  latitude: number | null
  longitude: number | null
  categories: {
    category: {
      id: number
      name: string
    }
  }[]
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
  image: true,
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
} as const;

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

  const rawResults = await prisma.$queryRawUnsafe<{ id: number; distance: number }[]>(sql, ...params);

  if (!Array.isArray(rawResults) || rawResults.length === 0) return [];

  const ids = rawResults.map((r) => r.id);
  const distanceMap = new Map(rawResults.map((r) => [r.id, r.distance]));

  const posts = await prisma.post.findMany({
    where: { id: { in: ids } },
    select: postFields,
  });

  return posts
    .map((p) => {
      const dist = distanceMap.get(p.id);
      return dist !== undefined ? { ...p, distance: dist } : null;
    })
    .filter((p): p is LocationSearchResult => p !== null)
    .sort((a, b) => a.distance - b.distance);
};
