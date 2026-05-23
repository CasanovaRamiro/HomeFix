import { createPost, findPostsByUserId } from "../data/post.data.js";
import { postServiceValidator } from "../middleware/postServiceValidator.js";
import { PostInput } from "../types/postInput.js";

export const listMyPosts = (userId: number) =>
  findPostsByUserId(userId, ['Active', 'Paused'])

export const post = async (input: PostInput) => {
  postServiceValidator(input);

  const createdPost = await createPost({
    ...input,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
  });

  return createdPost;
};
