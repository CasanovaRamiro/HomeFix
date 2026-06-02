import { createPost as createPostData, findPostById, findPostsByUser, updatePostStatus, findAvailablePosts, searchByDistance } from "../data/post.data.js";
import type { UserPostSummary } from "../data/post.data.js";
import type { PostDTO, UserPostDTO } from "../types/post.dto.js";

import {postServiceValidator} from "../middleware/postServiceValidator.js";

import { PostInput } from "../types/postInput.js";

const toUserPostDTO = (post: UserPostSummary): UserPostDTO => ({
  id: post.id,
  title: post.title,
  description: post.description,
  status: post.status,
  createdAt: post.createdAt.toISOString(),
  address: post.address,
  startDate: post.startDate.toISOString(),
  endDate: post.endDate.toISOString(),
  categories: post.categories,
  worker: post.worker,
  applicantCount: post.applicantCount,
});

const toPostDTO = (post: Awaited<ReturnType<typeof findAvailablePosts>>[number]): PostDTO => ({
  id: post.id,
  userId: post.userId,
  title: post.title,
  description: post.description,
  startDate: post.startDate.toISOString(),
  endDate: post.endDate.toISOString(),
  address: post.address,
  status: post.status,
  createdAt: post.createdAt.toISOString(),
  images: post.images,
  latitude: post.latitude,
  longitude: post.longitude,
  categories: (post.categories || []).map((item) => item.category),
  user: post.user,
});

export const createPost = async (input: PostInput) => {
  postServiceValidator(input);

  const createdPost = await createPostData({
    ...input,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
  });

  return createdPost;
};







export const listAvailablePosts = async (category?: string): Promise<PostDTO[]> => {
  const posts = await findAvailablePosts(category);
  return posts.map(toPostDTO);
};

export const searchPostsByDistance = async (
  lat: number,
  lng: number,
  radiusKm: number,
  category?: string,
): Promise<PostDTO[]> => {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusKm)) {
    throw new Error('lat, lng, and radius must be finite numbers');
  }
  if (radiusKm <= 0 || radiusKm > 1000) {
    throw new Error('radius must be between 1 and 1000 km');
  }
  if (lat < -90 || lat > 90) {
    throw new Error('latitude must be between -90 and 90');
  }
  if (lng < -180 || lng > 180) {
    throw new Error('longitude must be between -180 and 180');
  }

  const results = await searchByDistance(lat, lng, radiusKm, category);
  return results.map(toPostDTO);
};

export const getPostById = async (id: string): Promise<PostDTO | null> => {
  const found = await findPostById(id);
  if (!found) return null;
  return toPostDTO(found);
};

export const getUserPosts = async (userId: string): Promise<UserPostDTO[]> => {
  const posts = await findPostsByUser(userId);
  return posts.map(toUserPostDTO);
};

export const finalizePost = async (postId: string, userId: string) => {
  const post = await findPostById(postId);

  if (!post) {
    throw Object.assign(new Error('Post not found'), { status: 404 });
  }

  if (post.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  if (post.status !== 'Paused') {
    throw Object.assign(new Error('Post must be paused to be finalized'), { status: 400 });
  }

  return updatePostStatus(postId, 'Completed');
};
