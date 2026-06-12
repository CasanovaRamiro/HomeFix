import { describe, it, expect } from "vitest";
import { validatePostInput } from "../../src/domain/services/post.service.js";
import type { CreatePostInput } from "../../src/domain/types/post.types.js";

const validPostData: CreatePostInput = {
  userId: 'uuid-user-1',
  title: "Tubo roto en cocina",
  description: "El tubo bajo el lavaplatos está roto",
  startDate: new Date("2026-06-01T00:00:00.000Z"),
  endDate: new Date("2026-06-15T00:00:00.000Z"),
  address: "Calle Principal 123, Apt 4B",
  categoryId: 'uuid-category-1',
};

describe("postServiceValidator", () => {
  it("should throw error when no categories are selected", () => {
    expect(() =>
      validatePostInput({
        ...validPostData,
        categoryId: null as unknown as string,
      }),
    ).toThrow("At least one category must be selected");
  });

  it("should throw error when title is missing", () => {
    expect(() =>
      validatePostInput({
        ...validPostData,
        title: "",
      }),
    ).toThrow("title is required");
  });

  it("should throw error when description is missing", () => {
    expect(() =>
      validatePostInput({
        ...validPostData,
        description: "",
      }),
    ).toThrow("description is required");
  });

  it("should throw error when address is missing", () => {
    expect(() =>
      validatePostInput({
        ...validPostData,
        address: "",
      }),
    ).toThrow("address is required");
  });

  it('should fail when endDate is before startDate', () => {
    expect(() =>
      validatePostInput({
        ...validPostData,
        startDate: new Date("2026-06-30T00:00:00.000Z"),
        endDate: new Date("2026-06-01T00:00:00.000Z"),
      }),
    ).toThrow("endDate must be after startDate");
  });
});
