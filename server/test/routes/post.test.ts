import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/index.js";
import { cleanDb, createUser, createCategory } from "../helpers/db.js";
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
  startDate: new Date("2026-06-01"),
  endDate: new Date("2026-06-15"),
  address: "123 Test St",
  categoryId,
  status: "active",
  title: "Test Post",
});

describe("POST /posts", () => {

  it("should create a new post", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .send(createValidPost());
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("Test Post");
  });

  it("should return 400 for invalid post data", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ ...createValidPost(), title: "" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message", "Invalid post data");
  });

  it("should return 401 for unauthorized access", async () => {
    const res = await request(app).post("/posts").send(createValidPost());
    expect(res.status).toBe(401);
  });
});
