import { createPost, findPostById, findPostsByUser } from "../data/post.data.js";
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

export const getUserPosts = (userId: string) => findPostsByUser(userId);

export const getPostById = (id: string) => findPostById(id);
