import { describe, it, expect, vi, beforeEach } from "vitest"
import request from "supertest"

vi.mock("../../src/presentation/middleware/auth0.middleware.js", async () => {
  const mock = await import("../helpers/auth0Mock.js")
  return { jwtCheck: mock.jwtCheck }
})

vi.mock("../../src/domain/services/kyc.service.js", () => ({
  startKycVerification: vi.fn(),
}))

import { app } from "../../src/index.js"
import { startKycVerification } from "../../src/domain/services/kyc.service.js"

const token = "test-auth0-token"

beforeEach(() => {
  vi.clearAllMocks()
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
