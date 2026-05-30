import { describe, it, expect, beforeEach } from "vitest";
import { cleanDb, createCategory, createUser, prisma } from "../helpers/db.js";
import { PostInput } from "../../src/types/postInput.js";
import { createPost, findPostById, findPostsByUser } from "../../src/data/post.data.js";

let userId: string;
let categoryId: string;

beforeEach(async () => {
  await cleanDb();
  const user = await createUser({ email: "test@test.com", name: "Test", password: "hashed" });
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

describe("findPostById", () => {
  it("should return a post with categories", async () => {
    const post = await createPost(createValidPost());
    const result = await findPostById(post.id);

    expect(result).not.toBeNull();
    expect(result!.title).toBe("Test Post");
    expect(result!.categories).toHaveLength(1);
    expect(result!.categories[0].category.name).toBe("Test Category");
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

describe("findPostsByUser", () => {
  it("should return only posts for the given user", async () => {
    const otherUser = await createUser({
      email: "other@test.com",
      name: "Other",
      password: "hashed",
    });
    await createPost(createValidPost());
    await createPost({ ...createValidPost(), userId: otherUser.id, title: "Other post" });

    const posts = await findPostsByUser(userId);
    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe("Test Post");
  });

  it("should return only Active and Paused posts", async () => {
    await createPost(createValidPost());
    const p2 = await createPost({ ...createValidPost(), title: "Paused post" });
    await prisma.post.update({ where: { id: p2.id }, data: { status: "Paused" } });

    const posts = await findPostsByUser(userId);
    expect(posts).toHaveLength(2);
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
