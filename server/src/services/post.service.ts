import { create as createPostData } from "../data/post.data.js";

interface PostInput {
  id: number;
  userId: number;
  description: string;
  startDate: Date;
  endDate: Date;
  address: string;
  categoryIds: number[];
  title: string;
}

export const post = async (input: PostInput) => {
  const { categoryIds, ...postData } = input;

  if (categoryIds.length === 0) {
    throw new Error("At least one category must be selected");
  }
  if (!postData.startDate) {
    throw new Error("startDate is required");
  }
  if (!postData.title) {
    throw new Error("title is required");
  }
  if (!postData.description) {
    throw new Error("description is required");
  }
  if (!postData.address) {
    throw new Error("address is required");
  }

  const createdPost = await createPostData({
    ...postData,
    categories: {
      create: categoryIds.map((categoryId) => ({
        category: { connect: { id: categoryId } },
      })),
    },
  });

  return {
    ...createdPost,
    categoryIds,
  };
};
