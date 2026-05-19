import { describe, it, expect } from "vitest";
import { postServiceValidator } from "../../src/middleware/postServiceValidator.js";

const validPostData = {
  id: 1,
  userId: 1,
  title: "Tubo roto en cocina",
  description: "El tubo bajo el lavaplatos está roto",
  startDate: new Date("2026-06-01"),
  endDate: new Date("2026-06-30"),
  address: "Calle Principal 123, Apt 4B",
  categoryIds: [1, 2],
};

describe("postServiceValidator", () => {
  it("should throw error when no categories are selected", () => {
    expect(() =>
      postServiceValidator({
        ...validPostData,
        categoryIds: [],
      }),
    ).toThrow("At least one category must be selected");
  });

  it("should throw error when startDate is missing", () => {
    expect(() =>
      postServiceValidator({
        ...validPostData,
        startDate: undefined as any,
      }),
    ).toThrow("startDate is required");
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
});
