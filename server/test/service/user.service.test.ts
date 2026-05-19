import { describe, it, expect, vi, beforeEach } from "vitest";
import { create } from "../../src/data/post.data.js";
import * as postService from "../../src/services/post.service.js";

vi.mock("../../src/data/post.data.js", () => ({
  create: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

const validPostData = {
  id: 1,
  userId: 1,
  title: "Tubo roto en cocina",
  description: "El tubo bajo el lavaplatos está roto",
  startDate: new Date("2026-06-01"),
  endDate: new Date("2026-06-30"),
  address: "Calle Principal 123, Apt 4B",
  status: "Active",
  categoryIds: [1, 2],
};
describe("user.service - createPost", () => {
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

      categories: {
        create: [
          {
            category: {
              connect: { id: 1 },
            },
          },
          {
            category: {
              connect: { id: 2 },
            },
          },
        ],
      },
    });

    expect(result).toEqual(validPostData);
  });

  it("should call create for each post input", async () => {
    vi.mocked(create).mockResolvedValue(validPostData);

    await postService.post(validPostData);
    await postService.post({ ...validPostData, id: 2 });

    expect(create).toHaveBeenCalledTimes(2);
  });

  it("should map categoryIds into Prisma create structure", async () => {
    vi.mocked(create).mockResolvedValue(validPostData);

    await postService.post(validPostData);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: {
          create: [
            { category: { connect: { id: 1 } } },
            { category: { connect: { id: 2 } } },
          ],
        },
      }),
    );
  });

  
});

describe("user.service - createPost - possible failures", () => {
  it("should throw error when no categories are selected", async () => {
    await expect(
      postService.post({ ...validPostData, categoryIds: [] }),
    ).rejects.toThrow("At least one category must be selected");
  });

  it("should throw error when startDate is missing", async () => {
    await expect(
      postService.post({ ...validPostData, startDate: undefined as any }),
    ).rejects.toThrow("startDate is required");
  });

  it("should throw error when title is missing", async () => {
    await expect(
      postService.post({ ...validPostData, title: "" }),
    ).rejects.toThrow("title is required");
  });

  it("should throw error when description is missing", async () => {
    await expect(
      postService.post({ ...validPostData, description: "" }),
    ).rejects.toThrow("description is required");
  });

  it("should throw error when address is missing", async () => {
    await expect(
      postService.post({ ...validPostData, address: "" }),
    ).rejects.toThrow("address is required");
  });
});
