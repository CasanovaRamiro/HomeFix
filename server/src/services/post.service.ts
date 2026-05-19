import { create as createPostData } from "../data/post.data.js";
import {postServiceValidator} from "../middleware/postServiceValidator.js";
import {postServiceCategoryMapper} from "../middleware/postServiceCategoryMapper.js";
import { PostInput } from "../types/postInput.js";

export const post = async (input: PostInput) => {

  postServiceValidator(input);

  const mappedData = postServiceCategoryMapper(input);

  const { categoryIds, ...postData } = input;


  const createdPost = await createPostData({
    ...postData,
    categories: mappedData.categories,
  });

  return createdPost;
};
