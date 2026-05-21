import { describe, it, expect } from "vitest";
import { postServiceValidator } from "../../src/middleware/postServiceValidator.js";
import { PostInput } from "../../src/types/postInput.js";

const validPostData:PostInput = {
  userId: 1,
  title: "Tubo roto en cocina",
  description: "El tubo bajo el lavaplatos está roto",
  startDate: new Date("2026-06-01T00:00:00.000Z"),
  endDate: new Date("2026-06-15T00:00:00.000Z"),
  address: "Calle Principal 123, Apt 4B",
  categoryId: 1,
};

describe("postServiceValidator", () => {
  it("should throw error when no categories are selected", () => {
    expect(() =>
      postServiceValidator({
        ...validPostData,
        categoryId: null as unknown as number,
      }),
    ).toThrow("At least one category must be selected");
  });

  it("should throw error when title is missing", () => {
    expect(() =>
      postServiceValidator({
        ...validPostData,
        title: "",
      }),
    ).toThrow("title is required");
  });

  it("should throw error when description is missing", () => {
    expect(() =>
      postServiceValidator({
        ...validPostData,
        description: "",
      }),
    ).toThrow("description is required");
  });

  it("should throw error when address is missing", () => {
    expect(() =>
      postServiceValidator({
        ...validPostData,
        address: "",
      }),
    ).toThrow("address is required");
  });

  it('should fail when endDate is before startDate', () => {
    expect(() =>
      postServiceValidator({
        ...validPostData,
        startDate: new Date("2026-06-30T00:00:00.000Z"),
        endDate: new Date("2026-06-01T00:00:00.000Z"),
      }),
    ).toThrow("endDate must be after startDate");
  });
});
