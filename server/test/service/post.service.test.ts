import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPost } from "../../src/data/post.data.js";
import * as postService from "../../src/services/post.service.js";
import { PostInput } from "../../src/types/postInput.js";

vi.mock("../../src/data/post.data.js", () => ({
  createPost: vi.fn(),
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
