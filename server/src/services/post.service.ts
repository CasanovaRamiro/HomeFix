import { createPost, findPostById, findPostsByUser,updatePostStatus, findAvailablePosts} from "../data/post.data.js";
import { postServiceValidator } from "../middleware/postServiceValidator.js";
import { PostInput } from "../types/postInput.js";

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
