import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPost, findPostsByUserId } from "../../src/data/post.data.js";
import * as postService from "../../src/services/post.service.js";
import { PostInput } from "../../src/types/postInput.js";

vi.mock("../../src/data/post.data.js", () => ({
  createPost: vi.fn(),
  findPostsByUserId: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe("post.service - createPost", () => {
  const inputData: PostInput = {
    userId: 1,
    title: "Tubo roto en cocina",
    description: "El tubo bajo el lavaplatos está roto",
    startDate: new Date("2026-06-01T00:00:00.000Z"),
    endDate: new Date("2026-06-15T00:00:00.000Z"),
    address: "Calle Principal 123, Apt 4B",
    categoryId: 1,
  };
  const createdPostMock = {
    id: 1,
    userId: 1,
    title: "Tubo roto en cocina",
    description: "El tubo bajo el lavaplatos está roto",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-15"),
    address: "Calle Principal 123, Apt 4B",
    status: "Active",
    createdAt: new Date("2026-05-20"),
  };

  it("should create a post and return a PostResponseDto", async () => {
    vi.mocked(createPost).mockResolvedValue(createdPostMock);

    const result = await postService.post(inputData);

    expect(createPost).toHaveBeenCalledTimes(1);
    expect(createPost).toHaveBeenCalledWith({
      ...inputData,
      startDate: new Date(inputData.startDate),
      endDate: new Date(inputData.endDate),
    });

    expect(result).toEqual({
      id: 1,
      title: "Tubo roto en cocina",
      description: "El tubo bajo el lavaplatos está roto",
      startDate: new Date("2026-06-01").toISOString(),
      endDate: new Date("2026-06-15").toISOString(),
      address: "Calle Principal 123, Apt 4B",
      status: "Active",
      createdAt: new Date("2026-05-20").toISOString(),
    });
  });
});

describe("post.service - listMyPosts", () => {
  const postsMock = [
    { id: 1, userId: 1, title: "Post 1", description: "desc", status: "Active", startDate: new Date(), endDate: new Date(), address: "addr", createdAt: new Date("2026-05-20") },
    { id: 2, userId: 1, title: "Post 2", description: "desc", status: "Paused", startDate: new Date(), endDate: new Date(), address: "addr", createdAt: new Date("2026-05-21") },
  ];

  it("should call findPostsByUserId with userId and ['Active', 'Paused']", async () => {
    vi.mocked(findPostsByUserId).mockResolvedValue(postsMock);

    const result = await postService.listMyPosts(1);

    expect(findPostsByUserId).toHaveBeenCalledWith(1, ["Active", "Paused"]);
    expect(result).toHaveLength(2);
  });

  it("should return PostListItemDto array (no userId, dates as strings)", async () => {
    vi.mocked(findPostsByUserId).mockResolvedValue(postsMock);

    const result = await postService.listMyPosts(1);

    expect(result[0]).toEqual({
      id: 1,
      title: "Post 1",
      description: "desc",
      address: "addr",
      status: "Active",
      createdAt: new Date("2026-05-20").toISOString(),
    });
    expect(result[1]).toEqual({
      id: 2,
      title: "Post 2",
      description: "desc",
      address: "addr",
      status: "Paused",
      createdAt: new Date("2026-05-21").toISOString(),
    });
  });
});
