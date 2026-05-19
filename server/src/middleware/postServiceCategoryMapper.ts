import { PostInput } from "../types/postInput.js";
import { MappedPostData } from "../types/mappedPostData.js";


export const postServiceCategoryMapper = (input: PostInput): MappedPostData => {
  const { categoryIds, ...rest } = input;

  return {
    ...rest,
    categories: {
      create: categoryIds.map((categoryId) => ({
        category: { connect: { id: categoryId } },
      })),
    },
  };
};
