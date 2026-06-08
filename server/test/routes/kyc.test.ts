import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import request from "supertest"
import crypto from "crypto"

vi.mock("../../src/presentation/middleware/auth0.middleware.js", async () => {
  const mock = await import("../helpers/auth0Mock.js")
  return { jwtCheck: mock.jwtCheck }
})

vi.mock("../../src/domain/services/kyc.service.js", () => ({
  startKycVerification: vi.fn(),
  confirmKyc: vi.fn(),
  getKycStatus: vi.fn(),
  getKycDecision: vi.fn(),
  handleKycWebhook: vi.fn(),
}))

import { app } from "../../src/index.js"
import { startKycVerification, confirmKyc, getKycStatus, getKycDecision, handleKycWebhook } from "../../src/domain/services/kyc.service.js"

const token = "test-auth0-token"
const WEBHOOK_SECRET = "test-webhook-secret-key"

beforeEach(() => {
  vi.clearAllMocks()
  process.env.DIDIT_WEBHOOK_SECRET = WEBHOOK_SECRET
})

afterEach(() => {
  delete process.env.DIDIT_WEBHOOK_SECRET
})

describe("POST /kyc/session", () => {
  it("returns 401 without an auth token", async () => {
    const res = await request(app).post("/kyc/session").send({})

    expect(res.status).toBe(401)
  })

  it("returns 200 with session info when the service succeeds", async () => {
    vi.mocked(startKycVerification).mockResolvedValue({
      sessionId: "sess-1",
      sessionUrl: "https://verification.didit.me/session/sess-1",
    })

    const res = await request(app)
      .post("/kyc/session")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      sessionId: "sess-1",
      sessionUrl: "https://verification.didit.me/session/sess-1",
    })
  })

  it("calls the service with the email from the JWT claims", async () => {
    vi.mocked(startKycVerification).mockResolvedValue({
      sessionId: "sess-1",
      sessionUrl: "https://verification.didit.me/session/sess-1",
    })

    await request(app)
      .post("/kyc/session")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    expect(startKycVerification).toHaveBeenCalledTimes(1)
    expect(startKycVerification).toHaveBeenCalledWith("test@test.com")
  })

  it("returns 404 when the service throws 404 (user not in DB)", async () => {
    const err = new Error(
      "Usuario autenticado no encontrado en la base de datos",
    ) as Error & { status?: number }
    err.status = 404
    vi.mocked(startKycVerification).mockRejectedValue(err)

    const res = await request(app)
      .post("/kyc/session")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(404)
  })

  it("returns 502 when the service throws 502 (Didit error)", async () => {
    const err = new Error("El servicio de verificación rechazó la solicitud") as Error & {
      status?: number
    }
    err.status = 502
    vi.mocked(startKycVerification).mockRejectedValue(err)

    const res = await request(app)
      .post("/kyc/session")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(502)
  })

  it("returns 500 when the service throws an error without a status", async () => {
    vi.mocked(startKycVerification).mockRejectedValue(new Error("Unexpected"))

    const res = await request(app)
      .post("/kyc/session")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(500)
  })
})

describe("POST /kyc/confirm", () => {
  it("returns 400 when sessionId or email is missing", async () => {
    const res = await request(app).post("/kyc/confirm").send({ sessionId: "sess-1" })

    expect(res.status).toBe(400)
    expect(confirmKyc).not.toHaveBeenCalled()
  })

  it("returns 200 with mapped status when the session is verified", async () => {
    vi.mocked(confirmKyc).mockResolvedValue({
      status: "APPROVED",
      sessionId: "sess-abc",
    })

    const res = await request(app)
      .post("/kyc/confirm")
      .send({ sessionId: "sess-abc", email: "test@test.com" })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: "APPROVED", sessionId: "sess-abc" })
    expect(confirmKyc).toHaveBeenCalledWith("test@test.com", "sess-abc")
  })

  it("returns 404 when the user is not found", async () => {
    const err = new Error(
      "Usuario autenticado no encontrado en la base de datos",
    ) as Error & { status?: number }
    err.status = 404
    vi.mocked(confirmKyc).mockRejectedValue(err)

    const res = await request(app)
      .post("/kyc/confirm")
      .send({ sessionId: "sess-1", email: "test@test.com" })

    expect(res.status).toBe(404)
  })

  it("returns 502 when the Didit API is unreachable", async () => {
    const err = new Error("No se pudo contactar al servicio de verificación") as Error & {
      status?: number
    }
    err.status = 502
    vi.mocked(confirmKyc).mockRejectedValue(err)

    const res = await request(app)
      .post("/kyc/confirm")
      .send({ sessionId: "sess-1", email: "test@test.com" })

    expect(res.status).toBe(502)
  })
})

describe("GET /kyc/status", () => {
  it("returns 401 without an auth token", async () => {
    const res = await request(app).get("/kyc/status")

    expect(res.status).toBe(401)
  })

  it("returns 200 with the KYC status of the authenticated user", async () => {
    const verifiedAt = new Date("2026-06-07T12:00:00Z")
    vi.mocked(getKycStatus).mockResolvedValue({
      kycStatus: "APPROVED",
      kycVerifiedAt: verifiedAt,
      diditVerificationId: "sess-abc",
    })

    const res = await request(app)
      .get("/kyc/status")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      kycStatus: "APPROVED",
      kycVerifiedAt: verifiedAt.toISOString(),
      diditVerificationId: "sess-abc",
    })
    expect(getKycStatus).toHaveBeenCalledWith("test@test.com")
  })

  it("returns 404 when the user is not found", async () => {
    const err = new Error(
      "Usuario autenticado no encontrado en la base de datos",
    ) as Error & { status?: number }
    err.status = 404
    vi.mocked(getKycStatus).mockRejectedValue(err)

    const res = await request(app)
      .get("/kyc/status")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(404)
  })
})

describe("GET /kyc/decision/:sessionId", () => {
  it("returns 401 without an auth token", async () => {
    const res = await request(app).get("/kyc/decision/sess-1")

    expect(res.status).toBe(401)
  })

  it("returns 200 with the full decision from Didit", async () => {
    vi.mocked(getKycDecision).mockResolvedValue({
      sessionId: "sess-decision-1",
      status: "APPROVED",
      sessionKind: "user",
      vendorData: "user-uuid-42",
      idVerifications: [{ status: "Approved", full_name: "Juan Pérez" }],
      livenessChecks: [{ status: "Approved", score: 89 }],
      faceMatches: [{ status: "Approved", score: 94 }],
      amlScreenings: [],
    })

    const res = await request(app)
      .get("/kyc/decision/sess-decision-1")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.sessionId).toBe("sess-decision-1")
    expect(res.body.status).toBe("APPROVED")
    expect(res.body.idVerifications).toEqual([{ status: "Approved", full_name: "Juan Pérez" }])
    expect(getKycDecision).toHaveBeenCalledWith("sess-decision-1")
  })

  it("returns 404 when the session does not exist in Didit", async () => {
    const err = new Error("La sesión de verificación no existe") as Error & { status?: number }
    err.status = 404
    vi.mocked(getKycDecision).mockRejectedValue(err)

    const res = await request(app)
      .get("/kyc/decision/sess-nonexistent")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(404)
  })

  it("returns 502 when Didit API is unreachable", async () => {
    const err = new Error("El servicio de verificación rechazó la solicitud") as Error & {
      status?: number
    }
    err.status = 502
    vi.mocked(getKycDecision).mockRejectedValue(err)

    const res = await request(app)
      .get("/kyc/decision/sess-1")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(502)
  })

  it("returns 500 when the service throws an error without a status", async () => {
    vi.mocked(getKycDecision).mockRejectedValue(new Error("Unexpected"))

    const res = await request(app)
      .get("/kyc/decision/sess-1")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(500)
  })
})

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys)
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((obj as Record<string, unknown>)[key])
        return acc
      }, {})
  }
  return obj
}

function shortenFloats(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(shortenFloats)
  if (data !== null && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [k, shortenFloats(v)]),
    )
  }
  if (typeof data === "number" && !Number.isInteger(data) && data % 1 === 0) {
    return Math.trunc(data)
  }
  return data
}

function signV2(body: Record<string, unknown>, secret: string): string {
  const canonical = JSON.stringify(sortKeys(shortenFloats(body)))
  return crypto.createHmac("sha256", secret).update(canonical, "utf8").digest("hex")
}

function signSimple(body: Record<string, unknown>, secret: string): string {
  const canonical = [
    (body.timestamp as string) ?? "",
    (body.session_id as string) ?? "",
    (body.status as string) ?? "",
    (body.webhook_type as string) ?? "",
  ].join(":")
  return crypto.createHmac("sha256", secret).update(canonical).digest("hex")
}

describe("POST /kyc/webhook", () => {
  const basePayload = {
    event_id: "event-123",
    webhook_type: "status.updated",
    timestamp: Math.floor(Date.now() / 1000),
    session_id: "sess-webhook-1",
    status: "Approved",
    vendor_data: "test@test.com",
  }

  it("returns 401 without X-Timestamp header", async () => {
    const res = await request(app)
      .post("/kyc/webhook")
      .send(basePayload)

    expect(res.status).toBe(401)
  })

  it("returns 401 with invalid V2 signature", async () => {
    const res = await request(app)
      .post("/kyc/webhook")
      .set("X-Timestamp", String(basePayload.timestamp))
      .set("X-Signature-V2", "invalid-signature")
      .send(basePayload)

    expect(res.status).toBe(401)
  })

  it("returns 401 with invalid Simple signature", async () => {
    const res = await request(app)
      .post("/kyc/webhook")
      .set("X-Timestamp", String(basePayload.timestamp))
      .set("X-Signature-Simple", "invalid-signature")
      .send(basePayload)

    expect(res.status).toBe(401)
  })

  it("returns 401 with stale timestamp (> 300s)", async () => {
    const stalePayload = { ...basePayload, timestamp: Math.floor(Date.now() / 1000) - 400 }
    const sig = signV2(stalePayload, WEBHOOK_SECRET)

    const res = await request(app)
      .post("/kyc/webhook")
      .set("X-Timestamp", String(stalePayload.timestamp))
      .set("X-Signature-V2", sig)
      .send(stalePayload)

    expect(res.status).toBe(401)
  })

  it("returns 200 with valid V2 signature and processes webhook", async () => {
    vi.mocked(handleKycWebhook).mockResolvedValue({ processed: true })
    const sig = signV2(basePayload, WEBHOOK_SECRET)

    const res = await request(app)
      .post("/kyc/webhook")
      .set("X-Timestamp", String(basePayload.timestamp))
      .set("X-Signature-V2", sig)
      .send(basePayload)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true, processed: true })
    expect(handleKycWebhook).toHaveBeenCalledWith(basePayload)
  })

  it("returns 200 with valid Simple signature and processes webhook", async () => {
    vi.mocked(handleKycWebhook).mockResolvedValue({ processed: true })
    const sig = signSimple(basePayload, WEBHOOK_SECRET)

    const res = await request(app)
      .post("/kyc/webhook")
      .set("X-Timestamp", String(basePayload.timestamp))
      .set("X-Signature-Simple", sig)
      .send(basePayload)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true, processed: true })
    expect(handleKycWebhook).toHaveBeenCalledWith(basePayload)
  })

  it("returns 200 but processed:false for non-status.updated events", async () => {
    vi.mocked(handleKycWebhook).mockResolvedValue({ processed: false })
    const payload = { ...basePayload, webhook_type: "data.updated" }
    const sig = signV2(payload, WEBHOOK_SECRET)

    const res = await request(app)
      .post("/kyc/webhook")
      .set("X-Timestamp", String(payload.timestamp))
      .set("X-Signature-V2", sig)
      .send(payload)

    expect(res.status).toBe(200)
    expect(res.body.processed).toBe(false)
  })

  it("returns 200 even when service throws (idempotent)", async () => {
    vi.mocked(handleKycWebhook).mockRejectedValue(new Error("DB error"))
    const sig = signV2(basePayload, WEBHOOK_SECRET)

    const res = await request(app)
      .post("/kyc/webhook")
      .set("X-Timestamp", String(basePayload.timestamp))
      .set("X-Signature-V2", sig)
      .send(basePayload)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true, processed: false })
  })

  it("returns 500 when DIDIT_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.DIDIT_WEBHOOK_SECRET

    const res = await request(app)
      .post("/kyc/webhook")
      .set("X-Timestamp", String(basePayload.timestamp))
      .send(basePayload)

    expect(res.status).toBe(500)
  })

  it("does not require auth token (no jwtCheck)", async () => {
    vi.mocked(handleKycWebhook).mockResolvedValue({ processed: true })
    const sig = signV2(basePayload, WEBHOOK_SECRET)

    const res = await request(app)
      .post("/kyc/webhook")
      .set("X-Timestamp", String(basePayload.timestamp))
      .set("X-Signature-V2", sig)
      .send(basePayload)

    expect(res.status).toBe(200)
  })
})
