import { describe, it, expect, vi, beforeEach } from "vitest";
import { create } from "../../src/data/post.data.js";
import * as postService from "../../src/services/post.service.js";
import { PostInput } from "../../src/types/postInput.js";

vi.mock("../../src/data/post.data.js", () => ({
  create: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());


describe("post.service - createPost", () => {

  const validPostData:PostInput = {
  id: 1,
  userId: 1,
  title: "Tubo roto en cocina",
  description: "El tubo bajo el lavaplatos está roto",
  startDate: new Date("2026-06-01"),
  endDate: new Date("2026-06-30"),
  address: "Calle Principal 123, Apt 4B",
  status: "Active",
  categoryId: 1,
};

  it("should create a post successfully", async () => {
    vi.mocked(create).mockResolvedValue(validPostData);

    const result = await postService.post(validPostData);

    expect(create).toHaveBeenCalledTimes(1);

    expect(create).toHaveBeenCalledWith({
      id: 1,
      userId: 1,
      title: "Tubo roto en cocina",
      description: "El tubo bajo el lavaplatos está roto",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-30"),
      address: "Calle Principal 123, Apt 4B",
      status: "Active",
    },1);

    expect(result).toEqual(validPostData);
  });

  it("should call create for each post input", async () => {
    vi.mocked(create).mockResolvedValue(validPostData);

    await postService.post(validPostData);
    await postService.post({ ...validPostData, id: 2 });

    expect(create).toHaveBeenCalledTimes(2);
  });
});
