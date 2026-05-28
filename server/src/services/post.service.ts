import { createPost, findPostById, findPostsByUser,updatePostStatus, findAvailablePosts,searchByDistance} from "../data/post.data.js";
import { postServiceValidator } from "../middleware/postServiceValidator.js";
import { PostInput } from "../types/postInput.js";

const assertPositiveId = (id: number, label: string): void => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
};

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
  image: post.image,
  latitude: post.latitude,
  longitude: post.longitude,
  categories: (post.categories || []).map((item) => ({
    category: {
      id: item.category.id,
      name: item.category.name,
    },
  })),
});

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
  
  return results.map((r) => ({
    id: r.id,
    userId: r.userId,
    title: r.title,
    description: r.description,
    startDate: typeof r.startDate === 'string' ? r.startDate : new Date(r.startDate).toISOString(),
    endDate: typeof r.endDate === 'string' ? r.endDate : new Date(r.endDate).toISOString(),
    address: r.address,
    status: r.status,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date(r.createdAt).toISOString(),
    image: r.image,
    latitude: r.latitude,
    longitude: r.longitude,
    categories: (r.categories || []).map((item) => ({
      category: {
        id: item.category.id,
        name: item.category.name,
      },
    })),
  }));
};

export const getPostById = async (id: number): Promise<PostDTO> => {
  assertPositiveId(id, "Post id");
  const found = await findPostById(id);
  if (!found) {
    throw new Error("Post not found");
  }
  return toPostDTO(found);
};
export const finalizePost = async (postId: string, userId: string) => {
  const post = await findPostById(postId)

  if (!post) {
    throw Object.assign(new Error('Post not found'), { status: 404 })
  }

  if (post.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }

  if (post.status !== 'Paused') {
    throw Object.assign(new Error('Post must be paused to be finalized'), { status: 400 })
  }

  return updatePostStatus(postId, 'Finalized')
}


export const getUserPosts = (userId: string) => findPostsByUser(userId);

export const getPostById = (id: string) => findPostById(id);
