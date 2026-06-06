import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createDiditSession } from "../../src/infrastructure/providers/didit.provider.js"

const mockFetch = vi.fn()

const DIDIT_URL = "https://verification.didit.me/v3/session/"

beforeEach(() => {
  vi.stubEnv("DIDIT_API_KEY", "test-api-key")
  vi.stubEnv("DIDIT_WORKFLOW_ID", "test-workflow-id")
  vi.stubEnv("DIDIT_CALLBACK_URL", "")
  vi.stubGlobal("fetch", mockFetch)
  mockFetch.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe("createDiditSession", () => {
  it("sends a POST to Didit with the right URL, headers and body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        session_id: "sess-123",
        url: "https://verify.didit.me/session/sess-123",
      }),
    })

    await createDiditSession("user-uuid-abc")

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe(DIDIT_URL)
    expect(init.method).toBe("POST")
    expect(init.headers).toEqual({
      "x-api-key": "test-api-key",
      "Content-Type": "application/json",
      Accept: "application/json",
    })
    expect(JSON.parse(init.body)).toEqual({
      workflow_id: "test-workflow-id",
      vendor_data: "user-uuid-abc",
      expected_details: { id_country: "ARG" },
    })
  })

  it("includes callback and callback_method when DIDIT_CALLBACK_URL is set", async () => {
    vi.stubEnv("DIDIT_CALLBACK_URL", "http://localhost:5173/kyc")

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        session_id: "sess-1",
        url: "https://verify.didit.me/session/sess-1",
      }),
    })

    await createDiditSession("user-1")

    const [, init] = mockFetch.mock.calls[0]
    expect(JSON.parse(init.body)).toEqual({
      workflow_id: "test-workflow-id",
      vendor_data: "user-1",
      expected_details: { id_country: "ARG" },
      callback: "http://localhost:5173/kyc",
      callback_method: "both",
    })
  })

  it("omits callback when DIDIT_CALLBACK_URL is not set", async () => {
    vi.stubEnv("DIDIT_CALLBACK_URL", "")

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        session_id: "sess-1",
        url: "https://verify.didit.me/session/sess-1",
      }),
    })

    await createDiditSession("user-1")

    const [, init] = mockFetch.mock.calls[0]
    const body = JSON.parse(init.body)
    expect(body).not.toHaveProperty("callback")
    expect(body).not.toHaveProperty("callback_method")
    expect(body).toEqual({
      workflow_id: "test-workflow-id",
      vendor_data: "user-1",
      expected_details: { id_country: "ARG" },
    })
  })

  it("uses an AbortSignal so the request can be cancelled", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        session_id: "sess-1",
        url: "https://verify.didit.me/session/sess-1",
      }),
    })

    await createDiditSession("user-1")

    const [, init] = mockFetch.mock.calls[0]
    expect(init.signal).toBeDefined()
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it("returns { sessionUrl, sessionId } on success", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        session_id: "sess-xyz",
        url: "https://verify.didit.me/session/sess-xyz",
      }),
    })

    const result = await createDiditSession("user-1")

    expect(result).toEqual({
      sessionId: "sess-xyz",
      sessionUrl: "https://verify.didit.me/session/sess-xyz",
    })
  })

  it("throws 502 with friendly message when Didit returns non-OK", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => '{"detail":"You don\'t have enough credits"}',
    })

    await expect(createDiditSession("user-1")).rejects.toMatchObject({
      status: 502,
      message: "El servicio de verificación rechazó la solicitud",
    })
  })

  it("throws 502 when Didit returns 5xx", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service Unavailable",
    })

    await expect(createDiditSession("user-1")).rejects.toMatchObject({
      status: 502,
    })
  })

  it("throws 502 when fetch itself throws (network error)", async () => {
    mockFetch.mockRejectedValue(new Error("network down"))

    await expect(createDiditSession("user-1")).rejects.toMatchObject({
      status: 502,
      message: "No se pudo contactar al servicio de verificación",
    })
  })

  it("throws 502 when fetch is aborted (timeout)", async () => {
    const abortError = new Error("The operation was aborted")
    abortError.name = "AbortError"
    mockFetch.mockRejectedValue(abortError)

    await expect(createDiditSession("user-1")).rejects.toMatchObject({
      status: 502,
      message: "No se pudo contactar al servicio de verificación",
    })
  })

  it("throws 500 when DIDIT_API_KEY is not set", async () => {
    vi.stubEnv("DIDIT_API_KEY", "")

    await expect(createDiditSession("user-1")).rejects.toMatchObject({
      status: 500,
      message: "DIDIT_API_KEY is not configured",
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("throws 500 when DIDIT_WORKFLOW_ID is not set", async () => {
    vi.stubEnv("DIDIT_WORKFLOW_ID", "")

    await expect(createDiditSession("user-1")).rejects.toMatchObject({
      status: 500,
      message: "DIDIT_WORKFLOW_ID is not configured",
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("throws 502 when response is missing url", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ session_id: "sess-1" }),
    })

    await expect(createDiditSession("user-1")).rejects.toMatchObject({
      status: 502,
      message: "Respuesta inválida del servicio de verificación",
    })
  })

  it("throws 502 when response is missing session_id", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://verify.didit.me/session/x" }),
    })

    await expect(createDiditSession("user-1")).rejects.toMatchObject({
      status: 502,
      message: "Respuesta inválida del servicio de verificación",
    })
  })

  it("does not throw when the error body is unreadable", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => {
        throw new Error("body unreadable")
      },
    })

    await expect(createDiditSession("user-1")).rejects.toMatchObject({
      status: 502,
      message: "El servicio de verificación rechazó la solicitud",
    })
  })
})
