interface PostInput {
  categoryIds: number[];
  [key: string]: any;
}

interface MappedPostData {
  categories: {
    create: Array<{
      category: { connect: { id: number } };
    }>;
  };
  [key: string]: any;
}

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
