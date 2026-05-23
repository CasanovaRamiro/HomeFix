import { createPost, findPostsByUserId } from "../data/post.data.js";
import { postServiceValidator } from "../middleware/postServiceValidator.js";
import { PostInput } from "../types/postInput.js";
import type { PostResponseDto, PostListItemDto } from "../types/dto/post.dto.js";

const toPostListItem = (post: {
  id: number
  title: string
  description: string
  address: string
  status: string
  createdAt: Date
}): PostListItemDto => ({
  id: post.id,
  title: post.title,
  description: post.description,
  address: post.address,
  status: post.status,
  createdAt: post.createdAt.toISOString(),
})

const toPostResponse = (post: {
  id: number
  title: string
  description: string
  startDate: Date
  endDate: Date
  address: string
  status: string
  createdAt: Date
}): PostResponseDto => ({
  id: post.id,
  title: post.title,
  description: post.description,
  startDate: post.startDate.toISOString(),
  endDate: post.endDate.toISOString(),
  address: post.address,
  status: post.status,
  createdAt: post.createdAt.toISOString(),
})

export const listMyPosts = async (userId: number): Promise<PostListItemDto[]> => {
  const posts = await findPostsByUserId(userId, ['Active', 'Paused'])
  return posts.map(toPostListItem)
}

export const post = async (input: PostInput): Promise<PostResponseDto> => {
  postServiceValidator(input);

  const createdPost = await createPost({
    ...input,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
  });

  return toPostResponse(createdPost);
};
