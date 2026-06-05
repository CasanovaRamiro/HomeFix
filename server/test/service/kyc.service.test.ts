import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindByEmail, mockCreateDiditSession } = vi.hoisted(() => ({
  mockFindByEmail: vi.fn(),
  mockCreateDiditSession: vi.fn(),
}))

vi.mock("../../src/infrastructure/database/user.database.js", () => ({
  findByEmail: mockFindByEmail,
}))

vi.mock("../../src/infrastructure/providers/didit.provider.js", () => ({
  createDiditSession: mockCreateDiditSession,
}))

import { startKycVerification } from "../../src/domain/services/kyc.service.js"

describe("startKycVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("looks up the user by email and delegates to the provider with the user id", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-uuid-123",
      email: "foo@bar.com",
    })
    mockCreateDiditSession.mockResolvedValue({
      sessionUrl: "https://verification.didit.me/session/abc",
      sessionId: "sess-abc",
    })

    const result = await startKycVerification("foo@bar.com")

    expect(mockFindByEmail).toHaveBeenCalledWith("foo@bar.com")
    expect(mockCreateDiditSession).toHaveBeenCalledWith("user-uuid-123")
    expect(mockCreateDiditSession).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      sessionUrl: "https://verification.didit.me/session/abc",
      sessionId: "sess-abc",
    })
  })

  it("passes the internal user id (not the email) as vendor_data", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "internal-uuid-9999",
      email: "someone@example.com",
    })
    mockCreateDiditSession.mockResolvedValue({
      sessionUrl: "https://verification.didit.me/session/x",
      sessionId: "sess-x",
    })

    await startKycVerification("someone@example.com")

    const [vendorDataArg] = mockCreateDiditSession.mock.calls[0]
    expect(vendorDataArg).toBe("internal-uuid-9999")
    expect(vendorDataArg).not.toContain("@")
  })

  it("throws 404 with friendly message when the user is not found in DB", async () => {
    mockFindByEmail.mockResolvedValue(null)

    await expect(startKycVerification("missing@bar.com")).rejects.toMatchObject({
      status: 404,
      message: "Usuario autenticado no encontrado en la base de datos",
    })
    expect(mockCreateDiditSession).not.toHaveBeenCalled()
  })

  it("propagates provider errors (e.g. 502 from Didit)", async () => {
    mockFindByEmail.mockResolvedValue({ id: "user-1", email: "foo@bar.com" })
    const providerError = new Error("El servicio de verificación rechazó la solicitud") as Error & {
      status?: number
    }
    providerError.status = 502
    mockCreateDiditSession.mockRejectedValue(providerError)

    await expect(startKycVerification("foo@bar.com")).rejects.toMatchObject({
      status: 502,
      message: "El servicio de verificación rechazó la solicitud",
    })
  })

  it("propagates 500 from the provider (missing config)", async () => {
    mockFindByEmail.mockResolvedValue({ id: "user-1" })
    const providerError = new Error("DIDIT_API_KEY is not configured") as Error & {
      status?: number
    }
    providerError.status = 500
    mockCreateDiditSession.mockRejectedValue(providerError)

    await expect(startKycVerification("foo@bar.com")).rejects.toMatchObject({
      status: 500,
    })
  })
})
