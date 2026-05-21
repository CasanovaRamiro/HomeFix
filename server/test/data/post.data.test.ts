import { describe, it, expect, beforeEach } from "vitest";
import { cleanDb, createCategory, prisma } from "../helpers/db.js";
import { createUser } from "../../src/data/user.data.js";
import { PostInput } from "../../src/types/postInput.js";
import { createPost } from "../../src/data/post.data.js";

let userId: number;
let categoryId: number;

beforeEach(async () => {
  await cleanDb();
  const user = await createUser({
    email: "test@test.com",
    name: "Test",
    password: "hashed",
  });
  const category = await createCategory("Test Category");
  userId = user.id;
  categoryId = category.id;
});

const createValidPost = (): PostInput => ({
  userId,
  description: "Test description",
  startDate: new Date("2026-06-01T00:00:00.000Z"),
  endDate: new Date("2026-06-15T00:00:00.000Z"),
  address: "123 Test St",
  categoryId,
  title: "Test Post",
});

describe("createPost", () => {
  it("should create a post", async () => {
    const post = await createPost(createValidPost());
    expect(post.title).toBe("Test Post");
    expect(post.userId).toBe(userId);
  });

  it("should create a post and relate it to a category", async () => {
    const post = await createPost(createValidPost());

    expect(post.title).toBe("Test Post");

    const relation = await prisma.postCategory.findFirst({
      where: {
        postId: post.id,
        categoryId: categoryId,
      },
    });

    expect(relation).not.toBeNull();
  });

  it("should create postCategory relation when categoryId is provided", async () => {
    const post = await createPost(createValidPost());
    const relation = await prisma.postCategory.findFirst({
      where: {
        postId: post.id,
        categoryId: categoryId,
      },
    });
    expect(relation).not.toBeNull();
  });

  it("should fail when categoryId does not exist", async () => {
    await expect(
      createPost({
        ...createValidPost(),
        categoryId: 9999,
      }),
    ).rejects.toThrow();
  });

  it("should fail when userId does not exist", async () => {
    await expect(
      createPost({
        ...createValidPost(),
        userId: 9999,
      }),
    ).rejects.toThrow();
  });

  it('status should default to "active"', async () => {
    const post = await createPost(createValidPost());
    expect(post.status).toBe("Active");
  });
});
