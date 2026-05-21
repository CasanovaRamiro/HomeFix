import { createPost } from "../data/post.data.js";
import {postServiceValidator} from "../middleware/postServiceValidator.js";
import { PostInput } from "../types/postInput.js";

export const post = async (input: PostInput) => {

  postServiceValidator(input);

  const createdPost = await createPost(input);

  return createdPost;
};
