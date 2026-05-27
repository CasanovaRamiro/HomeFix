import { describe, it, expect, vi, beforeEach } from "vitest";
import { suggestPost,clearCategoryCache } from "../../src/services/ai.service.js";
import { AiMessage } from "../../src/types/aiSuggestion.js";

const mockFindMany = vi.hoisted(() => vi.fn());

vi.mock("../../src/lib/prisma.js", () => ({
  default: {
    category: {
      findMany: mockFindMany,
    },
  },
}));

const mockGenerateContent = vi.hoisted(() => vi.fn());

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  }
}));

describe("AI Suggestion Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCategoryCache();
    mockFindMany.mockResolvedValue([
      { id: 1, name: "Plomeria" },
      { id: 2, name: "Electricidad" },
    ]);


  });

  describe("basic functionality", () => {
    it("should generate a response", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            '{"type":"question","text":"¿Desde cuándo ocurre el problema?"}',
        },
      });

      const response = await suggestPost({
        messages: [{ role: "user", text: "Tengo una fuga de agua" }],
      });

      expect(response).toMatchObject({
        type: "question",
        text: "¿Desde cuándo ocurre el problema?",
      });
    });

    it("should return a valid response structure", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{"type":"question","text":"¿Desde cuándo ocurre?"}',
        },
      });

      const response = await suggestPost({
        messages: [{ role: "user", text: "Hay chispazos" }],
      });

      expect(response).toHaveProperty("type");
      expect(response).toHaveProperty("text");
    });

    it("should return either question or suggestion type", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            '{"type":"suggestion","data":{"suggestedTitle":"Problema eléctrico","suggestedCategoryId":2,"suggestedCategoryName":"Electricidad","possibleIssue":"Probablemente una fuga eléctrica.","confidence":"high"}}',
        },
      });

      const response = await suggestPost({
        messages: [{ role: "user", text: "Me da corriente" }],
      });

      expect(["question", "suggestion"]).toContain(response.type);
    });

    it("should process user messages correctly", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            '{"type":"question","text":"¿Ocurre con varios dispositivos?"}',
        },
      });

      const response = await suggestPost({
        messages: [{ role: "user", text: "Me da corriente" }],
      });

      expect(response.type).toBe("question");
    });

    it("should support multi-message conversations", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{"type":"question","text":"¿Desde cuándo ocurre?"}',
        },
      });

      await suggestPost({
        messages: [
          { role: "user", text: "Tengo humedad" },
          { role: "model", text: "¿Dónde aparece?" },
          { role: "user", text: "En el baño" },
        ],
      });

      expect(mockGenerateContent).toHaveBeenCalledTimes(1);

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: [
            {
              role: "user",
              parts: [{ text: "Tengo humedad" }],
            },
            {
              role: "model",
              parts: [{ text: "¿Dónde aparece?" }],
            },
            {
              role: "user",
              parts: [{ text: "En el baño" }],
            },
          ],
        }),
      );
    });
  });

  describe("suggestion flow", () => {
    it("should generate a category suggestion", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            '{"type":"suggestion","data":{"suggestedTitle":"Cortocircuito","suggestedCategoryId":2,"suggestedCategoryName":"Electricidad","possibleIssue":"Posible falla eléctrica.","confidence":"high"}}',
        },
      });

      const response = await suggestPost({
        messages: [{ role: "user", text: "Hay olor a quemado" }],
      });

      expect(response).toMatchObject({
        type: "suggestion",
        data: {
          suggestedCategoryId: 2,
          suggestedCategoryName: "Electricidad",
        },
      });
    });

    it("should generate a suggested title", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            '{"type":"suggestion","data":{"suggestedTitle":"Pérdida de agua","suggestedCategoryId":1,"suggestedCategoryName":"Plomeria","possibleIssue":"Probable fuga.","confidence":"medium"}}',
        },
      });

      const response = await suggestPost({
        messages: [{ role: "user", text: "Pierde agua el caño" }],
      });

      expect(response).toMatchObject({
        type: "suggestion",
        data: {
          suggestedTitle: "Pérdida de agua",
        },
      });
    });

    it("should generate a possible issue description", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            '{"type":"suggestion","data":{"suggestedTitle":"Fuga","suggestedCategoryId":1,"suggestedCategoryName":"Plomeria","possibleIssue":"Posiblemente haya una fuga interna.","confidence":"medium"}}',
        },
      });

      const response = await suggestPost({
        messages: [{ role: "user", text: "Tengo humedad" }],
      });

      expect(response).toMatchObject({
        type: "suggestion",
        data: {
          possibleIssue: "Posiblemente haya una fuga interna.",
        },
      });
    });

    it("should return a confidence level", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            '{"type":"suggestion","data":{"suggestedTitle":"Problema eléctrico","suggestedCategoryId":2,"suggestedCategoryName":"Electricidad","possibleIssue":"Posible fuga.","confidence":"high"}}',
        },
      });

      const response = await suggestPost({
        messages: [{ role: "user", text: "Me da corriente" }],
      });

      expect(response).toMatchObject({
        type: "suggestion",
        data: {
          confidence: "high",
        },
      });
    });

    it("should include normalized empty fields", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () =>
            '{"type":"suggestion","data":{"suggestedTitle":"Problema","suggestedCategoryId":2,"suggestedCategoryName":"Electricidad","possibleIssue":"Posible problema.","confidence":"high"}}',
        },
      });

      const response = await suggestPost({
        messages: [{ role: "user", text: "Me da corriente" }],
      });

      expect(response).toMatchObject({
        type: "suggestion",
        data: {
          startDate: null,
          endDate: null,
          address: null,
        },
      });
    });
  });

  describe("category handling", () => {
    it("should include database categories in system instructions", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{"type":"question","text":"¿Dónde ocurre?"}',
        },
      });

      await suggestPost({
        messages: [{ role: "user", text: "Tengo humedad" }],
      });

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          systemInstruction: expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({
                text: expect.stringContaining("1: Plomeria"),
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe("conversation handling", () => {
    it("should throw if no messages are provided", async () => {
      await expect(suggestPost({ messages: [] })).rejects.toThrow(
        "Se requiere al menos un mensaje para generar una sugerencia",
      );
    });

    it("should limit message history", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{"type":"question","text":"¿Dónde ocurre?"}',
        },
      });

      const messages: AiMessage[] = Array.from({ length: 10 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "model",
        text: `Mensaje ${i}`,
      }));

      await suggestPost({ messages });

      const generateContentCall = mockGenerateContent.mock.calls[0][0];

      expect(generateContentCall.contents).toHaveLength(6);
      expect(generateContentCall.contents).toEqual([
        { role: "user", parts: [{ text: "Mensaje 4" }] },
        { role: "model", parts: [{ text: "Mensaje 5" }] },
        { role: "user", parts: [{ text: "Mensaje 6" }] },
        { role: "model", parts: [{ text: "Mensaje 7" }] },
        { role: "user", parts: [{ text: "Mensaje 8" }] },
        { role: "model", parts: [{ text: "Mensaje 9" }] },
      ]);
    });

    it("should preserve latest conversation context", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{"type":"question","text":"¿Hace cuánto?"}',
        },
      });

      await suggestPost({
        messages: [
          { role: "user", text: "Mensaje viejo" },
          { role: "user", text: "Mensaje reciente" },
        ],
      });

      const generateContentCall = mockGenerateContent.mock.calls[0][0];

      expect(generateContentCall.contents).toEqual([
        {
          role: "user",
          parts: [{ text: "Mensaje viejo" }],
        },
        {
          role: "user",
          parts: [{ text: "Mensaje reciente" }],
        },
      ]);
    });
  });

  describe("multimodal support", () => {
    it("should process text-only messages", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{"type":"question","text":"¿Dónde ocurre?"}',
        },
      });

      await suggestPost({
        messages: [{ role: "user", text: "Tengo humedad" }],
      });

      const generateContentCall = mockGenerateContent.mock.calls[0][0];

      expect(generateContentCall.contents).toEqual([
        {
          role: "user",
          parts: [{ text: "Tengo humedad" }],
        },
      ]);
    });

    it("should process image messages", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{"type":"question","text":"¿Hace cuánto ocurre?"}',
        },
      });

      await suggestPost({
        messages: [
          {
            role: "user",
            text: "Mira esta pared",
            imageBase64: "data:image/png;base64,abc123",
            mimeType: "image/png",
          },
        ],
      });

      const generateContentCall = mockGenerateContent.mock.calls[0][0];

      expect(generateContentCall.contents).toEqual([
        {
          role: "user",
          parts: [
            { text: "Mira esta pared" },
            {
              inlineData: {
                data: "abc123",
                mimeType: "image/png",
              },
            },
          ],
        },
      ]);
    });

    it("should process mixed text and image messages", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{"type":"question","text":"¿Se expandió la humedad?"}',
        },
      });

      await suggestPost({
        messages: [
          {
            role: "user",
            text: "Mira esta pared",
            imageBase64: "data:image/png;base64,abc123",
            mimeType: "image/png",
          },
        ],
      });

      const generateContentCall = mockGenerateContent.mock.calls[0][0];

      expect(generateContentCall.contents).toEqual([
        {
          role: "user",
          parts: [
            { text: "Mira esta pared" },
            {
              inlineData: {
                data: "abc123",
                mimeType: "image/png",
              },
            },
          ],
        },
      ]);
    });
  });

  describe("error handling", () => {
    it("should throw when AI returns invalid JSON", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => "respuesta invalida",
        },
      });

      await expect(
        suggestPost({
          messages: [{ role: "user", text: "Hola" }],
        }),
      ).rejects.toThrow('Respuesta invalida de la IA');
    });

    it("should propagate API failures", async () => {
      mockGenerateContent.mockRejectedValue(new Error("Gemini API Error"));

      await expect(
        suggestPost({
          messages: [{ role: "user", text: "Hola" }],
        }),
      ).rejects.toThrow("Gemini API Error");
    });

    it("should propagate database errors", async () => {
      mockFindMany.mockRejectedValue(
        new Error("DB Error"),
      );

      await expect(
        suggestPost({
          messages: [{ role: "user", text: "Hola" }],
        }),
      ).rejects.toThrow("DB Error");
    });
  });

  describe("cache behavior", () => {
    it("should cache categories", async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{"type":"question","text":"¿Dónde ocurre?"}',
        },
      });

      await suggestPost({
        messages: [{ role: "user", text: "Hola" }],
      });

      await suggestPost({
        messages: [{ role: "user", text: "Hola otra vez" }],
      });

      expect(mockFindMany).toHaveBeenCalledTimes(1);
    });

    it("should refresh expired cache", async () => {
      vi.useFakeTimers();

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => '{"type":"question","text":"¿Dónde ocurre?"}',
        },
      });

      await suggestPost({
        messages: [{ role: "user", text: "Hola" }],
      });

      expect(mockFindMany).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(5 * 60 * 1000 + 1);

      await suggestPost({
        messages: [{ role: "user", text: "Hola de nuevo" }],
      });

      expect(mockFindMany).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });
});
