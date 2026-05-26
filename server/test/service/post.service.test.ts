import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPost, findPostById, findPostsByUser } from "../../src/data/post.data.js";
import * as postService from "../../src/services/post.service.js";
import { PostInput } from "../../src/types/postInput.js";

vi.mock("../../src/data/post.data.js", () => ({
  createPost: vi.fn(),
  findPostsByUser: vi.fn(),
  findPostById: vi.fn(),
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
  };

  it("should create a post successfully", async () => {
    vi.mocked(createPost).mockResolvedValue(createdPostMock);

    const result = await postService.post(inputData);

    expect(createPost).toHaveBeenCalledTimes(1);

    expect(createPost).toHaveBeenCalledWith({
      ...inputData,
      startDate: new Date(inputData.startDate),
      endDate: new Date(inputData.endDate),
    });

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
    categories: [
      {
        category: { id: 'uuid-category-1', name: "Plomeria" },
      },
    ],
  };

  it("should return a post by id", async () => {
    vi.mocked(findPostById).mockResolvedValue(postDetailMock);

    const result = await postService.getPostById('uuid-post-1');

    expect(findPostById).toHaveBeenCalledWith('uuid-post-1');
    expect(result).toEqual(postDetailMock);
  });

  it("should return null when post does not exist", async () => {
    vi.mocked(findPostById).mockResolvedValue(null);

    const result = await postService.getPostById('non-existent-id');

    expect(findPostById).toHaveBeenCalledWith('non-existent-id');
    expect(result).toBeNull();
  });
});

describe("post.service - getUserPosts", () => {
  const userPostsMock = [
    {
      id: 'uuid-post-1',
      title: "Test Post",
      description: "Test description",
      status: "Active",
      createdAt: new Date("2026-05-01"),
      address: "123 Test St",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-15"),
      categories: [{ id: 'uuid-category-1', name: "Plumbing" }],
    },
  ];

  it("should return posts for a valid userId", async () => {
    vi.mocked(findPostsByUser).mockResolvedValue(userPostsMock);

    const result = await postService.getUserPosts('uuid-user-1');

    expect(findPostsByUser).toHaveBeenCalledWith('uuid-user-1');
    expect(result).toEqual(userPostsMock);
  });

  it("should return empty array when no posts found", async () => {
    vi.mocked(findPostsByUser).mockResolvedValue([]);

    const result = await postService.getUserPosts('uuid-user-1');
    expect(result).toEqual([]);
  });
});
