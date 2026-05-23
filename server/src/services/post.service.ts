import { findAvailablePosts, findPostById } from "../data/post.data.js";
import type { PostDTO } from "../types/post.dto.js";

const assertPositiveId = (id: number, label: string): void => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
};

const toPostDTO = (post: Awaited<ReturnType<typeof findAvailablePosts>>[number]): PostDTO => ({
  id: post.id,
  userId: post.userId,
  title: post.title,
  description: post.description,
  startDate: post.startDate.toISOString(),
  endDate: post.endDate.toISOString(),
  address: post.address,
  status: post.status,
  createdAt: post.createdAt.toISOString(),
  image: post.image,
  categories: post.categories.map((item) => ({
    category: {
      id: item.category.id,
      name: item.category.name,
    },
  })),
});

export const listAvailablePosts = async (category?: string): Promise<PostDTO[]> => {
  const posts = await findAvailablePosts(category);
  return posts.map(toPostDTO);
};

export const getPostById = async (id: number): Promise<PostDTO> => {
  assertPositiveId(id, "Post id");
  const found = await findPostById(id);
  if (!found) {
    throw new Error("Post not found");
  }
  return toPostDTO(found);
};
