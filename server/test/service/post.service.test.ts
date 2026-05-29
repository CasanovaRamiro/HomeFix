import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPost, findPostById, findPostsByUser, updatePostStatus } from "../../src/data/post.data.js";
import * as postService from "../../src/services/post.service.js";
import type { PostInput } from "../../src/types/postInput.js";

vi.mock("../../src/data/post.data.js", () => ({
  createPost: vi.fn(),
  findPostsByUser: vi.fn(),
  findPostById: vi.fn(),
  updatePostStatus: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe("post.service - createPost", () => {
  const inputData: PostInput = {
    userId: 'uuid-user-1',
    title: "Tubo roto en cocina",
    description: "El tubo bajo el lavaplatos está roto",
    startDate: new Date("2026-06-01T00:00:00.000Z"),
    endDate: new Date("2026-06-15T00:00:00.000Z"),
    address: "Calle Principal 123, Apt 4B",
    categoryId: 'uuid-category-1',
  };
  const createdPostMock = {
    id: 'uuid-post-1',
    userId: 'uuid-user-1',
    title: "Tubo roto en cocina",
    description: "El tubo bajo el lavaplatos está roto",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-15"),
    address: "Calle Principal 123, Apt 4B",
    status: "Active",
    images: [],
    latitude: null,
    longitude: null,
    createdAt: new Date(),
    categories: [],
  };

  it("should create a post successfully", async () => {
    vi.mocked(createPost).mockResolvedValue(createdPostMock as any);

    const result = await postService.createPost(inputData);

    expect(createPost).toHaveBeenCalledTimes(1);

    expect(createPost).toHaveBeenCalledWith(inputData);

    expect(result).toEqual(createdPostMock);
  });
});

describe("post.service - getPostById", () => {
  const postDetailMock = {
    id: 'uuid-post-1',
    userId: 'uuid-user-1',
    title: "Tubo roto en cocina",
    description: "Descripcion detallada",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-15"),
    address: "Calle Principal 123",
    status: "Active",
    createdAt: new Date("2026-05-25"),
    images: [],
    latitude: null,
    longitude: null,
    categories: [
      {
        category: { id: 'uuid-category-1', name: "Plomeria" },
      },
    ],
    user: { id: 'uuid-user-1', name: "Test User", phone: null },
  };

  it("should return a post by id", async () => {
    vi.mocked(findPostById).mockResolvedValue(postDetailMock as any);

    const result = await postService.getPostById('uuid-post-1');

    expect(findPostById).toHaveBeenCalledWith('uuid-post-1');
    expect(result).toBeDefined();
    expect(result!.id).toBe('uuid-post-1');
    expect(result!.title).toBe('Tubo roto en cocina');
  });

  it("should return null when post does not exist", async () => {
    vi.mocked(findPostById).mockResolvedValue(null);

    const result = await postService.getPostById('non-existent-id');

    expect(findPostById).toHaveBeenCalledWith('non-existent-id');
    expect(result).toBeNull();
  });
});

describe("post.service - getUserPosts", () => {
  const userPostsMock: any[] = [
    {
      id: 'uuid-post-1',
      userId: 'uuid-user-1',
      title: "Test Post",
      description: "Test description",
      status: "Active",
      createdAt: new Date("2026-05-01"),
      address: "123 Test St",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-15"),
    images: [],
    latitude: null,
      longitude: null,
      categories: [
        { category: { id: 'uuid-category-1', name: "Plumbing" } },
      ],
    },
  ];

  it("should return posts for a valid userId", async () => {
    vi.mocked(findPostsByUser).mockResolvedValue(userPostsMock);

    const result = await postService.getUserPosts('uuid-user-1');

    expect(findPostsByUser).toHaveBeenCalledWith('uuid-user-1');
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].title).toBe('Test Post');
  });

  it("should return empty array when no posts found", async () => {
    vi.mocked(findPostsByUser).mockResolvedValue([]);

    const result = await postService.getUserPosts('uuid-user-1');
    expect(result).toEqual([]);
  });
});
describe('post.service - finalizePost', () => {
  const mockPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'Reparación de caño',
    description: 'Test',
    address: 'Calle 123',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-15'),
    status: 'Paused',
    createdAt: new Date("2026-05-25"),
    images: [],
    latitude: null,
    longitude: null,
    categories: [
      {
        category: { id: 'uuid-category-1', name: "Plomeria" },
      },
    ],
    user: { id: 'user-uuid-1', name: 'Test', surname: 'User', phone: null },
  }

  it('finaliza el post cuando está pausado y pertenece al usuario', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)
    vi.mocked(updatePostStatus).mockResolvedValue({ ...mockPost, status: 'Finalized', updatedAt: new Date() } as any)

    const result = await postService.finalizePost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Finalized')
    expect(result.status).toBe('Finalized')
  })

  it('lanza 404 si el post no existe', async () => {
    vi.mocked(findPostById).mockResolvedValue(null)

    await expect(postService.finalizePost('no-existe', 'user-uuid-1')).rejects.toMatchObject({ status: 404 })
  })

  it('lanza 403 si el post pertenece a otro usuario', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost as any)

    await expect(postService.finalizePost('uuid-1', 'otro-usuario')).rejects.toMatchObject({ status: 403 })
  })

  it('lanza 400 si el post no está en estado Paused', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...mockPost, status: 'Active' } as any)

    await expect(postService.finalizePost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })
})


