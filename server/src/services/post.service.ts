import { findAvailablePosts, findPostById } from "../data/post.data.js";

const assertPositiveId = (id: number, label: string): void => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
};

export const listAvailablePosts = async (category?: string) =>
  findAvailablePosts(category);

export const getPostById = async (id: number) => {
  assertPositiveId(id, "Post id");
  const found = await findPostById(id);
  if (!found) {
    throw new Error("Post not found");
  }
  return found;
};
