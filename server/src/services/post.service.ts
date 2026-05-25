import { createPost, findPostById, updatePostStatus } from "../data/post.data.js";
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
}
export const finalizePost = async (postId: number, userId: number) => {
  const post = await findPostById(postId);
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
};
