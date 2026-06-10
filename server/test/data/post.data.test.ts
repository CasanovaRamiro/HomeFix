import { describe, it, expect, beforeEach } from "vitest";
import { cleanDb, createCategory, createUser, prisma } from "../helpers/db.js";
import type { CreatePostInput } from "../../src/domain/types/post.types.js";
import { createPost, findPostById, findPostsByUser, findAvailablePosts, updatePostStatus } from "../../src/infrastructure/database/post.database.js";

let userId: string;
let categoryId: string;

beforeEach(async () => {
  await cleanDb();
  const user = await createUser("test@test.com", "Test", "hashed");
  const category = await createCategory("Test Category");
  userId = user.id;
  categoryId = category.id;
});

const createValidPost = (): CreatePostInput => ({
  userId,
  description: "Test description",
  startDate: new Date("2026-06-01T00:00:00.000Z"),
  endDate: new Date("2026-06-15T00:00:00.000Z"),
  address: "123 Test St",
  categoryId,
  title: "Test Post",
});

describe("findPostById", () => {
  it("should return a post with categories", async () => {
    const post = await createPost(createValidPost());
    const result = await findPostById(post.id);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Test Post");
    expect(result!.categories).toHaveLength(1);
    expect(result!.categories[0].name).toBe("Test Category");
  });

  it("should return null for non-existent post", async () => {
    const result = await findPostById('non-existent-id');
    expect(result).toBeNull();
  });

  it("should return createdAt field", async () => {
    const post = await createPost(createValidPost());
    const result = await findPostById(post.id);
    expect(result).not.toBeNull();
    expect(result!.createdAt).toBeInstanceOf(Date);
  });
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
        categoryId: 'non-existent-id',
      }),
    ).rejects.toThrow();
  });

  it("should fail when userId does not exist", async () => {
    await expect(
      createPost({
        ...createValidPost(),
        userId: 'non-existent-id',
      }),
    ).rejects.toThrow();
  });

  it('status should default to "active"', async () => {
    const post = await createPost(createValidPost());
    expect(post.status).toBe("Active");
  });
});

describe("findAvailablePosts", () => {
  it("should return only active posts", async () => {
    await createPost(createValidPost());
    const p2 = await createPost({ ...createValidPost(), title: "Cancelled post" });
    await prisma.post.update({ where: { id: p2.id }, data: { status: "Cancelled" } });

    const { posts } = await findAvailablePosts();
    expect(posts.length).toBeGreaterThanOrEqual(1);
    expect(posts.every((p) => p.status === "Active")).toBe(true);
  });

  it("should filter by category", async () => {
    const cat2 = await createCategory("Plomero");
    await createPost(createValidPost());
    await createPost({ ...createValidPost(), title: "Plumbing post", categoryId: cat2.id });

    const { posts } = await findAvailablePosts("Test Category");
    expect(posts.length).toBeGreaterThanOrEqual(1);
    expect(posts.every((p) => p.categories.some((c) => c.name === "Test Category"))).toBe(true);
  });

  it("should return empty array when no active posts match category", async () => {
    const { posts } = await findAvailablePosts("NonExistentCategory");
    expect(posts).toEqual([]);
  });
});

describe("updatePostStatus", () => {
  it("should update post status", async () => {
    const post = await createPost(createValidPost());
    const updated = await updatePostStatus(post.id, "Paused");
    expect(updated.status).toBe("Paused");
  });

  it("should throw on non-existent post", async () => {
    await expect(updatePostStatus("non-existent", "Paused")).rejects.toThrow();
  });
});

describe("findPostsByUser", () => {
  it("should return only posts for the given user", async () => {
    const otherUser = await createUser("other@test.com", "Other", "hashed");
    await createPost(createValidPost());
    await createPost({ ...createValidPost(), userId: otherUser.id, title: "Other post" });

    const posts = await findPostsByUser(userId);
    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe("Test Post");
    expect(posts[0].applicantCount).toBeDefined();
    expect(posts[0].applicantCount).toBe(0);
  });

  it("should return applicant count matching the number of applications", async () => {
    const post = await createPost(createValidPost());
    const worker1 = await createUser("worker1@test.com", "Worker1", "hashed1");
    const worker2 = await createUser("worker2@test.com", "Worker2", "hashed2");
    await prisma.application.createMany({
      data: [
        { workerId: worker1.id, postId: post.id },
        { workerId: worker2.id, postId: post.id },
      ],
    });

    const posts = await findPostsByUser(userId);
    expect(posts).toHaveLength(1);
    expect(posts[0].applicantCount).toBe(2);
  });

  it("should return Active, In progress, Paused and Completed posts", async () => {
    await createPost(createValidPost());
    const p2 = await createPost({ ...createValidPost(), title: "Paused post" });
    await prisma.post.update({ where: { id: p2.id }, data: { status: "Paused" } });
    const p3 = await createPost({ ...createValidPost(), title: "In progress post" });
    await prisma.post.update({ where: { id: p3.id }, data: { status: "In progress" } });

    const posts = await findPostsByUser(userId);
    expect(posts).toHaveLength(3);
  });

  it("should exclude posts with other statuses", async () => {
    await createPost(createValidPost());
    const p2 = await createPost({ ...createValidPost(), title: "Cancelled post" });
    await prisma.post.update({ where: { id: p2.id }, data: { status: "Cancelled" } });

    const posts = await findPostsByUser(userId);
    expect(posts).toHaveLength(1);
  });

  it("should return empty array when user has no posts", async () => {
    const posts = await findPostsByUser('non-existent-id');
    expect(posts).toEqual([]);
  });

  it("should include categories in the response", async () => {
    await createPost(createValidPost());
    const posts = await findPostsByUser(userId);
    expect(posts[0].categories).toBeDefined();
    expect(posts[0].categories).toEqual([{ id: expect.any(String), name: "Test Category" }]);
  });

  it("should order posts by createdAt descending", async () => {
    await createPost(createValidPost());
    await new Promise((r) => setTimeout(r, 50));
    await createPost({ ...createValidPost(), title: "Second post" });

    const posts = await findPostsByUser(userId);
    expect(posts).toHaveLength(2);
    expect(posts[0].title).toBe("Second post");
  });
});
