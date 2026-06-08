import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindByEmail, mockUpdateUserKycStatus, mockCreateDiditSession, mockGetSessionStatus, mockGetDecision } = vi.hoisted(() => ({
  mockFindByEmail: vi.fn(),
  mockUpdateUserKycStatus: vi.fn(),
  mockCreateDiditSession: vi.fn(),
  mockGetSessionStatus: vi.fn(),
  mockGetDecision: vi.fn(),
}))

vi.mock("../../src/infrastructure/database/user.database.js", () => ({
  findByEmail: mockFindByEmail,
  updateUserKycStatus: mockUpdateUserKycStatus,
}))

vi.mock("../../src/infrastructure/providers/didit.provider.js", () => ({
  createDiditSession: mockCreateDiditSession,
  getSessionStatus: mockGetSessionStatus,
  getDecision: mockGetDecision,
}))

import { startKycVerification, confirmKyc, getKycStatus, getKycDecision } from "../../src/domain/services/kyc.service.js"

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

describe("confirmKyc", () => {
  const user = {
    id: "user-uuid-123",
    email: "foo@bar.com",
    kycStatus: null,
    kycVerifiedAt: null,
    kycSessionId: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("verifies the session against Didit and updates the DB to APPROVED", async () => {
    mockFindByEmail.mockResolvedValue(user)
    mockGetSessionStatus.mockResolvedValue({
      sessionId: "sess-abc",
      status: "Approved",
      url: "https://verify.didit.me/session/sess-abc",
    })

    const result = await confirmKyc("foo@bar.com", "sess-abc")

    expect(mockGetSessionStatus).toHaveBeenCalledWith("sess-abc")
    expect(mockUpdateUserKycStatus).toHaveBeenCalledWith("foo@bar.com", {
      kycStatus: "APPROVED",
      kycVerifiedAt: expect.any(Date),
      kycSessionId: "sess-abc",
    })
    expect(result).toEqual({ status: "APPROVED", sessionId: "sess-abc" })
  })

  it("maps Declined from Didit and sets kycVerifiedAt", async () => {
    mockFindByEmail.mockResolvedValue(user)
    mockGetSessionStatus.mockResolvedValue({
      sessionId: "sess-declined",
      status: "Declined",
      url: "",
    })

    await confirmKyc("foo@bar.com", "sess-declined")

    expect(mockUpdateUserKycStatus).toHaveBeenCalledWith("foo@bar.com", {
      kycStatus: "DECLINED",
      kycVerifiedAt: expect.any(Date),
      kycSessionId: "sess-declined",
    })
  })

  it("maps in-progress statuses to IN_REVIEW (no kycVerifiedAt)", async () => {
    mockFindByEmail.mockResolvedValue(user)
    mockGetSessionStatus.mockResolvedValue({
      sessionId: "sess-review",
      status: "In Review",
      url: "",
    })

    await confirmKyc("foo@bar.com", "sess-review")

    expect(mockUpdateUserKycStatus).toHaveBeenCalledWith("foo@bar.com", {
      kycStatus: "IN_REVIEW",
      kycVerifiedAt: null,
      kycSessionId: "sess-review",
    })
  })

  it("maps Abandoned to EXPIRED", async () => {
    mockFindByEmail.mockResolvedValue(user)
    mockGetSessionStatus.mockResolvedValue({
      sessionId: "sess-abandoned",
      status: "Abandoned",
      url: "",
    })

    await confirmKyc("foo@bar.com", "sess-abandoned")

    expect(mockUpdateUserKycStatus).toHaveBeenCalledWith("foo@bar.com", {
      kycStatus: "EXPIRED",
      kycVerifiedAt: expect.any(Date),
      kycSessionId: "sess-abandoned",
    })
  })

  it("maps unknown Didit statuses to IN_REVIEW", async () => {
    mockFindByEmail.mockResolvedValue(user)
    mockGetSessionStatus.mockResolvedValue({
      sessionId: "sess-weird",
      status: "Something Strange",
      url: "",
    })

    await confirmKyc("foo@bar.com", "sess-weird")

    expect(mockUpdateUserKycStatus).toHaveBeenCalledWith("foo@bar.com", {
      kycStatus: "IN_REVIEW",
      kycVerifiedAt: null,
      kycSessionId: "sess-weird",
    })
  })

  it("throws 404 when the user is not found", async () => {
    mockFindByEmail.mockResolvedValue(null)

    await expect(confirmKyc("unknown@bar.com", "sess-1")).rejects.toMatchObject({
      status: 404,
      message: "Usuario autenticado no encontrado en la base de datos",
    })
    expect(mockGetSessionStatus).not.toHaveBeenCalled()
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })

  it("throws 404 when the session does not exist in Didit", async () => {
    mockFindByEmail.mockResolvedValue(user)
    const err = new Error("La sesión de verificación no existe") as Error & { status?: number }
    err.status = 404
    mockGetSessionStatus.mockRejectedValue(err)

    await expect(confirmKyc("foo@bar.com", "sess-nonexistent")).rejects.toMatchObject({
      status: 404,
      message: "La sesión de verificación no existe",
    })
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })

  it("propagates provider 502 errors", async () => {
    mockFindByEmail.mockResolvedValue(user)
    const err = new Error("El servicio de verificación rechazó la solicitud") as Error & {
      status?: number
    }
    err.status = 502
    mockGetSessionStatus.mockRejectedValue(err)

    await expect(confirmKyc("foo@bar.com", "sess-1")).rejects.toMatchObject({
      status: 502,
    })
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })
})

describe("getKycStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the stored KYC status for the user", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-uuid-123",
      email: "foo@bar.com",
      kycStatus: "APPROVED",
      kycVerifiedAt: new Date("2026-06-07T12:00:00Z"),
      kycSessionId: "sess-abc",
    })

    const result = await getKycStatus("foo@bar.com")

    expect(result).toEqual({
      kycStatus: "APPROVED",
      kycVerifiedAt: new Date("2026-06-07T12:00:00Z"),
      kycSessionId: "sess-abc",
    })
  })

  it("defaults to NOT_STARTED when kycStatus is not set", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-uuid-123",
      email: "foo@bar.com",
      kycStatus: null,
      kycVerifiedAt: null,
      kycSessionId: null,
    })

    const result = await getKycStatus("foo@bar.com")

    expect(result).toEqual({
      kycStatus: "NOT_STARTED",
      kycVerifiedAt: null,
      kycSessionId: null,
    })
  })

  it("throws 404 when the user is not found", async () => {
    mockFindByEmail.mockResolvedValue(null)

    await expect(getKycStatus("unknown@bar.com")).rejects.toMatchObject({
      status: 404,
      message: "Usuario autenticado no encontrado en la base de datos",
    })
  })
})

describe("getKycDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches the decision from Didit and maps the status", async () => {
    mockGetDecision.mockResolvedValue({
      sessionId: "sess-decision-1",
      status: "Approved",
      sessionKind: "user",
      vendorData: "user-uuid-42",
      idVerifications: [{ status: "Approved", full_name: "Juan Pérez" }],
      livenessChecks: [{ status: "Approved", score: 89 }],
      faceMatches: [{ status: "Approved", score: 94 }],
      amlScreenings: [],
    })

    const result = await getKycDecision("sess-decision-1")

    expect(mockGetDecision).toHaveBeenCalledWith("sess-decision-1")
    expect(result).toEqual({
      sessionId: "sess-decision-1",
      status: "APPROVED",
      sessionKind: "user",
      vendorData: "user-uuid-42",
      idVerifications: [{ status: "Approved", full_name: "Juan Pérez" }],
      livenessChecks: [{ status: "Approved", score: 89 }],
      faceMatches: [{ status: "Approved", score: 94 }],
      amlScreenings: [],
    })
  })

  it("maps Declined status", async () => {
    mockGetDecision.mockResolvedValue({
      sessionId: "sess-2",
      status: "Declined",
      sessionKind: "user",
      vendorData: null,
      idVerifications: [],
      livenessChecks: [],
      faceMatches: [],
      amlScreenings: [],
    })

    const result = await getKycDecision("sess-2")
    expect(result.status).toBe("DECLINED")
  })

  it("maps unknown statuses to IN_REVIEW", async () => {
    mockGetDecision.mockResolvedValue({
      sessionId: "sess-3",
      status: "Something Strange",
      sessionKind: "user",
      vendorData: null,
      idVerifications: [],
      livenessChecks: [],
      faceMatches: [],
      amlScreenings: [],
    })

    const result = await getKycDecision("sess-3")
    expect(result.status).toBe("IN_REVIEW")
  })

  it("propagates 404 from the provider", async () => {
    const err = new Error("La sesión de verificación no existe") as Error & { status?: number }
    err.status = 404
    mockGetDecision.mockRejectedValue(err)

    await expect(getKycDecision("sess-nonexistent")).rejects.toMatchObject({
      status: 404,
    })
  })

  it("propagates 502 from the provider", async () => {
    const err = new Error("El servicio de verificación rechazó la solicitud") as Error & {
      status?: number
    }
    err.status = 502
    mockGetDecision.mockRejectedValue(err)

    await expect(getKycDecision("sess-1")).rejects.toMatchObject({ status: 502 })
  })
})
