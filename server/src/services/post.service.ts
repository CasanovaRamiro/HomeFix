import { createPost, findPostsByUser } from "../data/post.data.js";
import { postServiceValidator } from "../middleware/postServiceValidator.js";
import { PostInput } from "../types/postInput.js";

export const post = async (input: PostInput) => {
  postServiceValidator(input);

  const createdPost = await createPost({
    ...input,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
  });

  return createdPost;
};

export const getUserPosts = async (userId: number) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    const err = new Error("Invalid userId") as Error & { status?: number };
    err.status = 400;
    throw err;
  }

  const posts = await findPostsByUser(userId);

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
