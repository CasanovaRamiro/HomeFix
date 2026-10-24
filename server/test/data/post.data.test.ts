import { describe, it, expect, beforeEach } from "vitest";
import { cleanDb, createCategory, createUser, prisma } from "../helpers/db.js";
import type { CreatePostInput } from "../../src/domain/types/post.types.js";
import { PostType } from "../../src/domain/types/postType.js";
import { createPost, findPostById, findPostsByUser, findAvailablePosts, findAvailableSubcontracts, updatePostStatus, createSubPost, findEmergencyPosts, searchByDistance } from "../../src/infrastructure/database/post.database.js";
import { findApplicationsByWorker } from "../../src/infrastructure/database/application.database.js";
import { acceptApplication, applyToPost, dismissWorker } from "../../src/domain/services/application.service.js";
import { pausePost, reopenPost, updatePost as updatePostService } from "../../src/domain/services/post.service.js";

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

  it("should create an emergency post with type 'emergency' when isEmergency is true", async () => {
    const post = await createPost({ ...createValidPost(), isEmergency: true });
    expect(post.type).toBe("emergency");
    expect(post.isEmergency).toBe(true);
  });

  it("should set emergencyExpiresAt for emergency posts", async () => {
    const post = await createPost({ ...createValidPost(), isEmergency: true });
    expect(post.emergencyExpiresAt).toBeInstanceOf(Date);
    expect(post.emergencyExpiresAt!.getTime()).toBeGreaterThan(Date.now());
  });

  it("should not create emergency post when isEmergency is false", async () => {
    const post = await createPost(createValidPost());
    expect(post.type).toBe("post");
    expect(post.isEmergency).not.toBe(true);
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

  it("hides expired emergencies without deleting hired or completed history and reviews", async () => {
    const worker = await createUser("worker-expiry@test.com", "Worker", "hashed");
    const normal = await createPost(createValidPost());
    const current = await createPost({ ...createValidPost(), isEmergency: true, title: "Current emergency" });
    const expired = await createPost({ ...createValidPost(), isEmergency: true, title: "Expired emergency" });
    const hired = await createPost({ ...createValidPost(), isEmergency: true, title: "Hired emergency" });
    const completed = await createPost({ ...createValidPost(), isEmergency: true, title: "Completed emergency" });
    const past = new Date(Date.now() - 60_000);

    await prisma.post.updateMany({
      where: { id: { in: [normal.id, current.id, expired.id, hired.id, completed.id] } },
      data: { latitude: -34.6037, longitude: -58.3816 },
    });

    await prisma.post.update({ where: { id: expired.id }, data: { emergencyExpiresAt: past } });
    await prisma.post.update({ where: { id: hired.id }, data: { emergencyExpiresAt: past, status: "In progress" } });
    await prisma.post.update({ where: { id: completed.id }, data: { emergencyExpiresAt: past, status: "Completed" } });
    const hiredApplication = await prisma.application.create({
      data: { postId: hired.id, workerId: worker.id, status: "Accepted" },
    });
    const completedApplication = await prisma.application.create({
      data: { postId: completed.id, workerId: worker.id, status: "Completed" },
    });
    const pendingApplication = await prisma.application.create({
      data: { postId: expired.id, workerId: worker.id, status: "Pending" },
    });
    const review = await prisma.workerReview.create({
      data: { applicationId: completedApplication.id, reviewerId: userId, workerId: worker.id, rating: 5, description: "Great work" },
    });
    const clientReview = await prisma.clientReview.create({
      data: { applicationId: completedApplication.id, reviewerId: worker.id, clientId: userId, rating: 5, description: "Reliable client" },
    });

    for (let read = 0; read < 2; read++) {
      const { posts, total } = await findAvailablePosts();
      expect(posts.map((post) => post.id).sort()).toEqual([normal.id, current.id].sort());
      expect(total).toBe(2);
      expect((await findEmergencyPosts()).map((post) => post.id)).toEqual([current.id]);
      expect((await searchByDistance(-34.6037, -58.3816, 1)).map((post) => post.id).sort()).toEqual([normal.id, current.id].sort());
      const history = await findPostsByUser(userId);
      expect(history.map((post) => post.id)).toEqual(expect.arrayContaining([hired.id, completed.id]));
      const workerHistory = await findApplicationsByWorker(worker.id);
      expect(workerHistory.map((application) => application.postId)).toEqual(expect.arrayContaining([hired.id, completed.id]));
      expect(await prisma.post.findUnique({ where: { id: expired.id } })).not.toBeNull();
      expect(await prisma.post.findUnique({ where: { id: hired.id } })).toMatchObject({ status: "In progress" });
      expect(await prisma.post.findUnique({ where: { id: completed.id } })).toMatchObject({ status: "Completed" });
      expect(await prisma.application.findUnique({ where: { id: hiredApplication.id } })).toMatchObject({ status: "Accepted" });
      expect(await prisma.application.findUnique({ where: { id: completedApplication.id } })).toMatchObject({ status: "Completed" });
      expect(await prisma.application.findUnique({ where: { id: pendingApplication.id } })).toMatchObject({ status: "Pending" });
      expect(await prisma.workerReview.findUnique({ where: { id: review.id } })).toMatchObject({ rating: 5 });
      expect(await prisma.clientReview.findUnique({ where: { id: clientReview.id } })).toMatchObject({ rating: 5 });
    }
  });

  it("rejects applying by ID to an expired emergency without deleting an earlier application", async () => {
    const worker = await createUser("worker-direct@test.com", "Worker", "hashed");
    const other = await createUser("worker-existing@test.com", "Other", "hashed");
    const emergency = await createPost({ ...createValidPost(), isEmergency: true });
    const earlier = await prisma.application.create({ data: { postId: emergency.id, workerId: other.id, status: "Pending" } });
    await prisma.post.update({ where: { id: emergency.id }, data: { emergencyExpiresAt: new Date(Date.now() - 60_000) } });

    await expect(applyToPost(worker.id, { postId: emergency.id })).rejects.toMatchObject({ status: 400 });
    expect(await prisma.application.count({ where: { postId: emergency.id } })).toBe(1);
    expect(await prisma.application.findUnique({ where: { id: earlier.id } })).toMatchObject({ status: "Pending" });
    expect(await findPostById(emergency.id)).not.toBeNull();
  });

  it("does not reactivate or reopen expired emergencies or mutate an accepted contract", async () => {
    const worker = await createUser("worker-reopen@test.com", "Worker", "hashed");
    const paused = await createPost({ ...createValidPost(), isEmergency: true, title: "Paused emergency" });
    const hired = await createPost({ ...createValidPost(), isEmergency: true, title: "Hired emergency" });
    const past = new Date(Date.now() - 60_000);
    await prisma.post.update({ where: { id: paused.id }, data: { status: "Paused", emergencyExpiresAt: past } });
    await prisma.post.update({ where: { id: hired.id }, data: { status: "In progress", emergencyExpiresAt: past } });
    const contract = await prisma.application.create({ data: { postId: hired.id, workerId: worker.id, status: "Accepted" } });

    await expect(pausePost(paused.id, userId)).rejects.toMatchObject({ status: 400 });
    await expect(reopenPost(hired.id, userId)).rejects.toMatchObject({ status: 400 });
    expect(await prisma.post.findUnique({ where: { id: paused.id } })).toMatchObject({ status: "Paused" });
    expect(await prisma.post.findUnique({ where: { id: hired.id } })).toMatchObject({ status: "In progress" });
    expect(await prisma.application.findUnique({ where: { id: contract.id } })).toMatchObject({ status: "Accepted" });
  });
});

describe("emergency acceptance and dismissal", () => {
  const past = () => new Date(Date.now() - 60_000);

  it("rejects accepting a pending application on an expired emergency", async () => {
    const worker = await createUser("worker-accept-expired@test.com", "Worker", "hashed");
    const emergency = await createPost({ ...createValidPost(), isEmergency: true });
    const application = await prisma.application.create({
      data: { postId: emergency.id, workerId: worker.id, status: "Pending" },
    });
    await prisma.post.update({ where: { id: emergency.id }, data: { emergencyExpiresAt: past() } });

    await expect(acceptApplication(userId, application.id)).rejects.toMatchObject({ status: 400 });

    expect(await prisma.application.findUnique({ where: { id: application.id } })).toMatchObject({ status: "Pending" });
    expect(await prisma.post.findUnique({ where: { id: emergency.id } })).toMatchObject({ status: "Active" });
  });

  it("accepts a pending application while the emergency is current", async () => {
    const worker = await createUser("worker-accept-current@test.com", "Worker", "hashed");
    const emergency = await createPost({ ...createValidPost(), isEmergency: true });
    const application = await prisma.application.create({
      data: { postId: emergency.id, workerId: worker.id, status: "Pending" },
    });

    await acceptApplication(userId, application.id);

    expect(await prisma.application.findUnique({ where: { id: application.id } })).toMatchObject({ status: "Accepted" });
    expect(await prisma.post.findUnique({ where: { id: emergency.id } })).toMatchObject({ status: "In progress" });
  });

  it("does not reactivate an expired emergency when dismissing the accepted worker", async () => {
    const worker = await createUser("worker-dismiss-expired@test.com", "Worker", "hashed");
    const emergency = await createPost({ ...createValidPost(), isEmergency: true });
    const application = await prisma.application.create({
      data: { postId: emergency.id, workerId: worker.id, status: "Accepted" },
    });
    await prisma.post.update({
      where: { id: emergency.id },
      data: { status: "In progress", emergencyExpiresAt: past() },
    });

    await dismissWorker(userId, application.id);

    expect(await prisma.application.findUnique({ where: { id: application.id } })).toMatchObject({ status: "Dismissed" });
    expect(await prisma.post.findUnique({ where: { id: emergency.id } })).toMatchObject({ status: "Paused" });
  });

  it("reopens a current emergency when dismissing the accepted worker", async () => {
    const worker = await createUser("worker-dismiss-current@test.com", "Worker", "hashed");
    const emergency = await createPost({ ...createValidPost(), isEmergency: true });
    const application = await prisma.application.create({
      data: { postId: emergency.id, workerId: worker.id, status: "Accepted" },
    });
    await prisma.post.update({ where: { id: emergency.id }, data: { status: "In progress" } });

    await dismissWorker(userId, application.id);

    expect(await prisma.post.findUnique({ where: { id: emergency.id } })).toMatchObject({ status: "Active" });
  });

  it("creates a pending application on a current emergency through the guarded write", async () => {
    const worker = await createUser("worker-apply-current@test.com", "Worker", "hashed");
    const emergency = await createPost({ ...createValidPost(), isEmergency: true });

    const created = await applyToPost(worker.id, { postId: emergency.id });

    expect(created.status).toBe("Pending");
    expect(await prisma.application.count({ where: { postId: emergency.id } })).toBe(1);
    expect(await findPostById(emergency.id)).toMatchObject({ emergencyExpiresAt: expect.any(Date) });
  });

  it("toggles and reopens a current emergency, resetting the accepted application", async () => {
    const worker = await createUser("worker-reopen-current@test.com", "Worker", "hashed");
    const emergency = await createPost({ ...createValidPost(), isEmergency: true, title: "Reopen emergency" });
    const application = await prisma.application.create({
      data: { postId: emergency.id, workerId: worker.id, status: "Accepted" },
    });

    await pausePost(emergency.id, userId);
    expect(await prisma.post.findUnique({ where: { id: emergency.id } })).toMatchObject({ status: "Paused" });

    await pausePost(emergency.id, userId);
    expect(await prisma.post.findUnique({ where: { id: emergency.id } })).toMatchObject({ status: "Active" });

    await prisma.post.update({ where: { id: emergency.id }, data: { status: "In progress" } });
    await reopenPost(emergency.id, userId);

    expect(await prisma.post.findUnique({ where: { id: emergency.id } })).toMatchObject({ status: "Active" });
    expect(await prisma.application.findUnique({ where: { id: application.id } })).toMatchObject({ status: "Pending" });
    expect((await findPostById(emergency.id))!.emergencyExpiresAt!.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("updatePost emergency preservation", () => {
  const editableInput = () => ({
    title: "Edited emergency",
    description: "Edited description",
    startDate: new Date("2026-06-02T00:00:00.000Z"),
    endDate: new Date("2026-06-16T00:00:00.000Z"),
    address: "456 Edited St",
    categoryId,
  });

  it("keeps a current emergency expiration and its application when editing", async () => {
    const worker = await createUser("worker-update-current@test.com", "Worker", "hashed");
    const emergency = await createPost({ ...createValidPost(), isEmergency: true });
    const application = await prisma.application.create({
      data: { postId: emergency.id, workerId: worker.id, status: "Pending" },
    });
    const originalExpiry = emergency.emergencyExpiresAt!.getTime();

    const updated = await updatePostService(emergency.id, userId, {
      ...editableInput(),
      isEmergency: false,
      type: PostType.Post,
      emergencyExpiresAt: new Date(Date.now() - 60_000),
    } as unknown as Parameters<typeof updatePostService>[2]);

    expect(updated.title).toBe("Edited emergency");
    expect(updated.type).toBe(PostType.Emergency);
    expect(updated.isEmergency).toBe(true);
    expect(updated.emergencyExpiresAt?.getTime()).toBe(originalExpiry);

    const stored = await prisma.post.findUnique({ where: { id: emergency.id } });
    expect(stored?.type).toBe(PostType.Emergency);
    expect(stored?.isEmergency).toBe(true);
    expect(stored?.emergencyExpiresAt?.getTime()).toBe(originalExpiry);
    expect(await prisma.application.findUnique({ where: { id: application.id } })).toMatchObject({
      status: "Pending",
      postId: emergency.id,
    });
  });

  it("keeps an expired emergency expired and hides it from available posts after editing", async () => {
    const emergency = await createPost({ ...createValidPost(), isEmergency: true });
    const expiredAt = new Date(Date.now() - 60_000);
    await prisma.post.update({ where: { id: emergency.id }, data: { emergencyExpiresAt: expiredAt } });

    const updated = await updatePostService(emergency.id, userId, editableInput());

    expect(updated.status).toBe("Active");
    expect(updated.type).toBe(PostType.Emergency);
    expect(updated.isEmergency).toBe(true);
    expect(updated.emergencyExpiresAt?.getTime()).toBe(expiredAt.getTime());

    const available = await findAvailablePosts();
    expect(available.posts.some((post) => post.id === emergency.id)).toBe(false);
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

  it("should include a Cancelled post that had a hired worker", async () => {
    const worker = await createUser("worker@test.com", "Worker", "hashed");
    const post = await createPost(createValidPost());
    await prisma.application.create({ data: { workerId: worker.id, postId: post.id, status: "Accepted" } });
    await prisma.post.update({ where: { id: post.id }, data: { status: "Cancelled" } });

    const posts = await findPostsByUser(userId);
    expect(posts).toHaveLength(1);
    expect(posts[0].status).toBe("Cancelled");
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

describe("findAvailableSubcontracts", () => {
  it("should return only active subcontracts", async () => {
    await prisma.post.create({
      data: {
        userId,
        title: "Electricista needed",
        description: "Subcontract for electrical work",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-15"),
        address: "Calle 123",
        status: "Active",
        type: "subcontract",
        categories: { create: { categoryId } },
      },
    });

    const posts = await findAvailableSubcontracts();
    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe("Electricista needed");
    expect(posts[0].type).toBe("subcontract");
  });

  it("should exclude regular posts", async () => {
    await createPost(createValidPost());

    const posts = await findAvailableSubcontracts();
    expect(posts).toEqual([]);
  });

  it("should exclude non-active subcontracts", async () => {
    await prisma.post.create({
      data: {
        userId,
        title: "Cancelled subcontract",
        description: "Test",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-15"),
        address: "Calle 123",
        status: "Cancelled",
        type: "subcontract",
        categories: { create: { categoryId } },
      },
    });

    const posts = await findAvailableSubcontracts();
    expect(posts).toEqual([]);
  });

  it("should return empty array when no subcontracts exist", async () => {
    const posts = await findAvailableSubcontracts();
    expect(posts).toEqual([]);
  });
});

describe("createSubPost", () => {
  it("should create a subcontract post with positions", async () => {
    const post = await createSubPost({
      userId,
      title: "Subcontract for electrical",
      description: "Need electricians",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-15"),
      address: "Calle 123",
      positions: [{ categoryId, quantity: 2, roleDescription: "Senior electrician" }],
    });

    expect(post.title).toBe("Subcontract for electrical");
    expect(post.type).toBe("subcontract");
    expect(post.categories).toHaveLength(1);
    expect(post.categories[0].quantity).toBe(2);
    expect(post.categories[0].roleDescription).toBe("Senior electrician");
  });

  it("should create a subcontract linked to a parent post", async () => {
    const parent = await createPost(createValidPost());

    const sub = await createSubPost({
      userId,
      parentPostId: parent.id,
      title: "Sub post",
      description: "Desc",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-15"),
      address: "Calle 123",
      positions: [{ categoryId, quantity: 1, roleDescription: "Worker" }],
    });

    expect(sub.parentPostId).toBe(parent.id);
    expect(sub.type).toBe("subcontract");
  });

  it("should default status to Active", async () => {
    const post = await createSubPost({
      userId,
      title: "Sub",
      description: "Desc",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-15"),
      address: "Calle 123",
      positions: [{ categoryId, quantity: 1, roleDescription: "Worker" }],
    });

    expect(post.status).toBe("Active");
  });

  it("should not be an emergency post", async () => {
    const post = await createSubPost({
      userId,
      title: "Sub",
      description: "Desc",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-15"),
      address: "Calle 123",
      positions: [{ categoryId, quantity: 1, roleDescription: "Worker" }],
    });

    expect(post.isEmergency).toBe(false);
  });
});

describe("findEmergencyPosts", () => {
  const futureExpiry = new Date(Date.now() + 60 * 60 * 1000);

  it("should return active emergency posts not yet expired", async () => {
    await prisma.post.create({
      data: {
        userId,
        title: "Emergency Post",
        description: "Urgent",
        address: "Calle 123",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-15"),
        status: "Active",
        type: "emergency",
        emergencyExpiresAt: futureExpiry,
        categories: { create: { categoryId } },
      },
    });

    const posts = await findEmergencyPosts();
    expect(posts.length).toBeGreaterThanOrEqual(1);
    expect(posts.every((p) => p.type === "emergency")).toBe(true);
  });

  it("should return empty array when no emergency posts exist", async () => {
    const posts = await findEmergencyPosts();
    expect(posts).toEqual([]);
  });

  it("should filter by category when provided", async () => {
    const otherCat = await createCategory("Other Category");
    await prisma.post.create({
      data: {
        userId,
        title: "Emergency Post",
        description: "Urgent",
        address: "Calle 123",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-15"),
        status: "Active",
        type: "emergency",
        emergencyExpiresAt: futureExpiry,
        categories: { create: { categoryId } },
      },
    });
    await prisma.post.create({
      data: {
        userId,
        title: "Other Emergency",
        description: "Other",
        address: "Calle 456",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-15"),
        status: "Active",
        type: "emergency",
        emergencyExpiresAt: futureExpiry,
        categories: { create: { categoryId: otherCat.id } },
      },
    });

    const posts = await findEmergencyPosts("Test Category");
    expect(posts.every((p) => p.categories.some((c) => c.name === "Test Category"))).toBe(true);
  });

  it("should not return posts with type 'post' even if isEmergency is true", async () => {
    await prisma.post.create({
      data: {
        userId,
        title: "Legacy Emergency",
        description: "Urgent",
        address: "Calle 123",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-15"),
        status: "Active",
        type: "post",
        isEmergency: true,
        emergencyExpiresAt: futureExpiry,
        categories: { create: { categoryId } },
      },
    });

    const posts = await findEmergencyPosts();
    expect(posts).toEqual([]);
  });

  it("should not return non-emergency posts", async () => {
    await createPost(createValidPost());

    const posts = await findEmergencyPosts();
    expect(posts).toEqual([]);
  });
});

describe("createPost with images", () => {
  it("should attach images when provided", async () => {
    const post = await createPost({
      ...createValidPost(),
      images: [{ url: "https://example.com/img1.jpg" }, { url: "https://example.com/img2.jpg" }],
    });

    expect(post.images).toHaveLength(2);
    expect(post.images.map((i: { url: string }) => i.url)).toContain("https://example.com/img1.jpg");
  });
});

describe("searchByDistance", () => {
  const BA_LAT = -34.6037;
  const BA_LNG = -58.3816;

  it("returns empty array when no posts are within the radius", async () => {
    const results = await searchByDistance(BA_LAT, BA_LNG, 1);
    expect(results).toEqual([]);
  });

  it("returns posts within the radius with distance field", async () => {
    await prisma.post.create({
      data: {
        userId,
        title: "Nearby Post",
        description: "Near Buenos Aires",
        address: "Corrientes 1000",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-15"),
        status: "Active",
        type: "post",
        latitude: BA_LAT,
        longitude: BA_LNG,
        categories: { create: { categoryId } },
      },
    });

    const results = await searchByDistance(BA_LAT, BA_LNG, 1);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].distance).toBeDefined();
    expect(typeof results[0].distance).toBe("number");
  });

  it("filters by category when provided", async () => {
    const otherCat = await createCategory("Other");
    await prisma.post.create({
      data: {
        userId,
        title: "Nearby Post",
        description: "Near",
        address: "Corrientes 1000",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-15"),
        status: "Active",
        type: "post",
        latitude: BA_LAT,
        longitude: BA_LNG,
        categories: { create: { categoryId } },
      },
    });
    await prisma.post.create({
      data: {
        userId,
        title: "Other Post",
        description: "Near other",
        address: "Corrientes 2000",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-15"),
        status: "Active",
        type: "post",
        latitude: BA_LAT,
        longitude: BA_LNG,
        categories: { create: { categoryId: otherCat.id } },
      },
    });

    const results = await searchByDistance(BA_LAT, BA_LNG, 1, "Test Category");
    expect(results.every((p) => p.categories.some((c) => c.name === "Test Category"))).toBe(true);
  });

  it("orders results by distance ascending", async () => {
    const CLOSE_LAT = BA_LAT;
    const CLOSE_LNG = BA_LNG;
    const FAR_LAT = BA_LAT + 0.05;
    const FAR_LNG = BA_LNG;

    await prisma.post.create({
      data: {
        userId,
        title: "Far Post",
        description: "Far",
        address: "Far address",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-15"),
        status: "Active",
        type: "post",
        latitude: FAR_LAT,
        longitude: FAR_LNG,
        categories: { create: { categoryId } },
      },
    });
    await prisma.post.create({
      data: {
        userId,
        title: "Close Post",
        description: "Close",
        address: "Close address",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-15"),
        status: "Active",
        type: "post",
        latitude: CLOSE_LAT,
        longitude: CLOSE_LNG,
        categories: { create: { categoryId } },
      },
    });

    const results = await searchByDistance(BA_LAT, BA_LNG, 10);
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0].distance).toBeLessThanOrEqual(results[1].distance);
  });
});
