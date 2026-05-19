import { describe, it, expect } from "vitest";
import { postServiceCategoryMapper } from "../../src/middleware/postServiceCategoryMapper.js";

const input = {
  id: 1,
  userId: 1,
  title: "Test",
  description: "Test desc",
  startDate: new Date("2026-06-01"),
  endDate: new Date("2026-06-30"),
  address: "Test address",
  categoryIds: [1, 2],
};

describe("postServiceCategoryMapper", () => {
  it("should map categoryIds to Prisma categories structure", () => {
    const result = postServiceCategoryMapper(input);

    expect(result.categories).toEqual({
      create: [
        {
          category: { connect: { id: 1 } },
        },
        {
          category: { connect: { id: 2 } },
        },
      ],
    });
  });

  it("should preserve original fields", () => {
    const result = postServiceCategoryMapper(input);

    expect(result).toMatchObject({
      id: 1,
      userId: 1,
      title: "Test",
      address: "Test address",
    });
  });
});
