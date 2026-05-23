import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/index.js";
import { cleanDb, createUser, createCategory, prisma } from "../helpers/db.js";
import { PostInput } from "../../src/types/postInput.js";
import { getTestToken } from "../helpers/auth.js";

let token: string;
let userId: number;
let categoryId: number;

beforeEach(async () => {
  await cleanDb();
  const user = await createUser("test@test.com", "Test", "hashed");
  const category = await createCategory("Test Category");
  userId = user.id;
  categoryId = category.id;
  token = getTestToken(userId);
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

describe("POST /posts/create", () => {

  it("should create a new post", async () => {
    const res = await request(app)
      .post("/posts/create")
      .set("Authorization", `Bearer ${token}`)
      .send(createValidPost());
    expect(res.status).toBe(201);

    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("Test Post");
  });

  it("should return 400 for invalid post data", async () => {
    const res = await request(app)
      .post("/posts/create")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...createValidPost(), title: "" });
    expect(res.status).toBe(400);
  });

  it("should return 401 for unauthorized access", async () => {
    const res = await request(app).post("/posts/create").send(createValidPost());
    expect(res.status).toBe(401);
  });

});

describe("GET /posts/mine", () => {
  let categoryId: number;

  beforeEach(async () => {
    await cleanDb();
    await prisma.user.create({
      data: { id: 1, email: "test@test.com", name: "Test", password: "hashed" },
    });
    const category = await prisma.category.create({ data: { name: "Test Category" } });
    categoryId = category.id;
  });

  const createPostWithCategory = async (data: { title: string; status: string }) =>
    prisma.post.create({
      data: {
        userId: 1,
        title: data.title,
        description: "desc",
        startDate: new Date(),
        endDate: new Date(),
        address: "addr",
        status: data.status,
        categories: { create: { categoryId } },
      },
    });

  it("should return 200 with the user's Active posts", async () => {
    await createPostWithCategory({ title: "Active Post", status: "Active" });
    await createPostWithCategory({ title: "Paused Post", status: "Paused" });

    const res = await request(app).get("/posts/mine");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe("Paused Post");
    expect(res.body[0].categories).toEqual([{ id: categoryId, name: "Test Category" }]);
  });

  it("should only return Active and Paused posts (exclude other statuses)", async () => {
    await createPostWithCategory({ title: "Active Post", status: "Active" });
    await createPostWithCategory({ title: "Cancelled Post", status: "Cancelled" });

    const res = await request(app).get("/posts/mine");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe("Active Post");
    expect(res.body[0].categories).toEqual([{ id: categoryId, name: "Test Category" }]);
  });

  it("should return 200 with empty array when user has no posts", async () => {
    const res = await request(app).get("/posts/mine");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
