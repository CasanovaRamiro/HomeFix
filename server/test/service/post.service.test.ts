import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPost } from "../../src/data/post.data.js";
import * as postService from "../../src/services/post.service.js";
import { PostInput } from "../../src/types/postInput.js";

vi.mock("../../src/data/post.data.js", () => ({
  createPost: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe("post.service - createPost", () => {
  const validPostData: PostInput = {
    userId: 1,
    title: "Tubo roto en cocina",
    description: "El tubo bajo el lavaplatos está roto",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-30"),
    address: "Calle Principal 123, Apt 4B",
    categoryId: 1,
  };
  const createdPostMock = {
    id: 1,
    userId: 1,
    title: "Tubo roto en cocina",
    description: "El tubo bajo el lavaplatos está roto",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-30"),
    address: "Calle Principal 123, Apt 4B",
    status: "Active",
  };

  it("should create a post successfully", async () => {
    vi.mocked(createPost).mockResolvedValue(createdPostMock);

    const result = await postService.post(validPostData);

    expect(createPost).toHaveBeenCalledTimes(1);

    expect(createPost).toHaveBeenCalledWith(validPostData);

    expect(result).toEqual(createdPostMock);
  });
});
