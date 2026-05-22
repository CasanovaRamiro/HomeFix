import { createPost, findPostById, findPostsByUser,updatePostStatus, findAvailablePosts} from "../data/post.data.js";
import { postServiceValidator } from "../middleware/postServiceValidator.js";
import { PostInput } from "../types/postInput.js";

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
export const finalizePost = async (postId: string, userId: string) => {
  const post = await findPostById(postId)

  if (!post) {
    throw Object.assign(new Error('Post not found'), { status: 404 })
  }

  if (post.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }

  if (post.status !== 'Paused') {
    throw Object.assign(new Error('Post must be paused to be finalized'), { status: 400 })
  }

  return updatePostStatus(postId, 'Finalized')
}


export const getUserPosts = (userId: string) => findPostsByUser(userId);

export const getPostById = (id: string) => findPostById(id);
