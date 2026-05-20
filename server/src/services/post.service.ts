import { create as createPostData } from "../data/post.data.js";
import {postServiceValidator} from "../middleware/postServiceValidator.js";
import { PostInput } from "../types/postInput.js";

export const post = async (input: PostInput) => {

  postServiceValidator(input);

  const { categoryId, ...postData } = input;

  const createdPost = await createPostData(postData,categoryId);

  return createdPost;
};
