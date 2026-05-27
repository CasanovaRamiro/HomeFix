import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../../src/middleware/auth0.middleware.js", async () => {
  const mock = await import("../helpers/auth0Mock.js");
  return { jwtCheck: mock.jwtCheck };
});

vi.mock("../../src/services/ai.service.js", () => ({
  suggestPost: vi.fn(),
}));

import { app } from "../../src/index.js";
import { suggestPost } from "../../src/services/ai.service.js";

const token = "test-auth0-token";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /ai/suggest", () => {
  it("should return 401 without auth token", async () => {
    const res = await request(app)
      .post("/ai/suggest")
      .send({ messages: [] });

    expect(res.status).toBe(401);
  });

  it("should return 200 with valid token and messages", async () => {
    vi.mocked(suggestPost).mockResolvedValue({
      type: "question",
      text: "¿Cuál es tu dirección?",
    });

    const res = await request(app)
      .post("/ai/suggest")
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "user", text: "Se rompió la canilla" }] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      type: "question",
      text: "¿Cuál es tu dirección?",
    });
  });

  it("should return 200 with suggestion response", async () => {
    vi.mocked(suggestPost).mockResolvedValue({
      type: "suggestion",
      data: {
        suggestedTitle: "Reparación de canilla",
        suggestedCategoryId: 1,
        suggestedCategoryName: "Plomería",
        possibleIssue: "Posible problema de pérdida de agua en la cocina.",
        startDate: "2026-05-23T00:00:00.000Z",
        endDate: "2026-05-25T00:00:00.000Z",
        address: "Av. Siempre Viva 123",
        confidence: "high",
      },
    });

    const res = await request(app)
      .post("/ai/suggest")
      .set("Authorization", `Bearer ${token}`)
      .send({ messages: [{ role: "user", text: "Se rompió la canilla" }] });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe("suggestion");
    expect(res.body.data.suggestedCategoryId).toBe(1);
  });

  it("should return 400 when service throws", async () => {
    vi.mocked(suggestPost).mockRejectedValue(new Error("messages is required"));

    const res = await request(app)
      .post("/ai/suggest")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("should handle messages with imageBase64", async () => {
    vi.mocked(suggestPost).mockResolvedValue({
      type: "question",
      text: "¿Qué es eso?",
    });

    const res = await request(app)
      .post("/ai/suggest")
      .set("Authorization", `Bearer ${token}`)
      .send({
        messages: [
          {
            role: "user",
            text: "Se ve así",
            imageBase64: "data:image/jpeg;base64,/9j/4AAQ==",
            mimeType: "image/jpeg",
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(suggestPost).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ imageBase64: expect.any(String) }),
        ]),
      }),
    );
  });
});
