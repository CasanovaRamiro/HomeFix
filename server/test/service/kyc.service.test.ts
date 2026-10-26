import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockFindByEmail, mockUpdateUserDiditVerificationId, mockUpdateUserKycStatus, mockCreateDiditSession, mockGetSessionStatus, mockGetDecision } = vi.hoisted(() => ({
  mockFindByEmail: vi.fn(),
  mockUpdateUserDiditVerificationId: vi.fn(),
  mockUpdateUserKycStatus: vi.fn(),
  mockCreateDiditSession: vi.fn(),
  mockGetSessionStatus: vi.fn(),
  mockGetDecision: vi.fn(),
}))

vi.mock("../../src/infrastructure/database/user.database.js", () => ({
  findByEmail: mockFindByEmail,
  updateUserDiditVerificationId: mockUpdateUserDiditVerificationId,
  updateUserKycStatus: mockUpdateUserKycStatus,
}))

vi.mock("../../src/infrastructure/providers/didit.provider.js", () => ({
  createDiditSession: mockCreateDiditSession,
  getSessionStatus: mockGetSessionStatus,
  getDecision: mockGetDecision,
}))

import { startKycVerification, confirmKyc, getKycStatus, getKycDecision, getKycDecisionForUser, handleKycWebhook } from "../../src/domain/services/kyc.service.js"

describe("startKycVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("looks up the user by email and delegates to the provider with the user email as vendor_data", async () => {
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
    expect(mockCreateDiditSession).toHaveBeenCalledWith("foo@bar.com")
    expect(mockCreateDiditSession).toHaveBeenCalledTimes(1)
    expect(mockUpdateUserDiditVerificationId).toHaveBeenCalledWith("foo@bar.com", "sess-abc")
    expect(result).toEqual({
      sessionUrl: "https://verification.didit.me/session/abc",
      sessionId: "sess-abc",
    })
  })

  it("passes the user email as vendor_data so the webhook can find the user", async () => {
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
    expect(vendorDataArg).toBe("someone@example.com")
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

  it("throws 409 when KYC is already APPROVED", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-1",
      email: "foo@bar.com",
      kycStatus: "APPROVED",
    })

    await expect(startKycVerification("foo@bar.com")).rejects.toMatchObject({
      status: 409,
      message: "Ya tenés la verificación aprobada",
    })
    expect(mockCreateDiditSession).not.toHaveBeenCalled()
  })

  it("throws 409 when KYC is already IN_REVIEW", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-1",
      email: "foo@bar.com",
      kycStatus: "IN_REVIEW",
      diditVerificationId: "sess-abc",
    })

    await expect(startKycVerification("foo@bar.com")).rejects.toMatchObject({
      status: 409,
      message: "Ya tenés una verificación en curso",
    })
    expect(mockCreateDiditSession).not.toHaveBeenCalled()
  })
})

describe("confirmKyc", () => {
  const user = {
    id: "user-uuid-123",
    email: "foo@bar.com",
    kycStatus: null,
    kycVerifiedAt: null,
    diditVerificationId: "sess-abc",
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("verifies the owned session against Didit and updates the DB to APPROVED", async () => {
    mockFindByEmail.mockResolvedValue(user)
    mockGetDecision.mockResolvedValue({
      sessionId: "sess-abc",
      status: "Approved",
      vendorData: "foo@bar.com",
    })

    const result = await confirmKyc("foo@bar.com", "sess-abc")

    expect(mockGetDecision).toHaveBeenCalledWith("sess-abc")
    expect(mockUpdateUserKycStatus).toHaveBeenCalledWith("foo@bar.com", {
      kycStatus: "APPROVED",
      kycVerifiedAt: expect.any(Date),
      diditVerificationId: "sess-abc",
    })
    expect(result).toEqual({ status: "APPROVED", sessionId: "sess-abc" })
  })

  it("rejects a session owned by another user", async () => {
    mockFindByEmail.mockResolvedValue(user)
    await expect(confirmKyc("foo@bar.com", "sess-other")).rejects.toMatchObject({ status: 403 })
    expect(mockGetDecision).not.toHaveBeenCalled()
  })

  it("throws 404 when the user is not found", async () => {
    mockFindByEmail.mockResolvedValue(null)

    await expect(confirmKyc("unknown@bar.com", "sess-1")).rejects.toMatchObject({
      status: 404,
      message: "Usuario autenticado no encontrado en la base de datos",
    })
    expect(mockGetDecision).not.toHaveBeenCalled()
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })

  it("does not approve when Didit fails", async () => {
    mockFindByEmail.mockResolvedValue(user)
    const err = new Error("La sesión de verificación no existe") as Error & { status?: number }
    err.status = 404
    mockGetDecision.mockRejectedValue(err)

    await expect(confirmKyc("foo@bar.com", "sess-abc")).rejects.toMatchObject({
      status: 404,
      message: "La sesión de verificación no existe",
    })
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })

  it("rejects a mismatched decision session", async () => {
    mockFindByEmail.mockResolvedValue(user)
    mockGetDecision.mockResolvedValue({ sessionId: "sess-other", status: "Approved", vendorData: "foo@bar.com" })
    await expect(confirmKyc("foo@bar.com", "sess-abc")).rejects.toMatchObject({ status: 502 })
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })

  it("rejects an incomplete decision", async () => {
    mockFindByEmail.mockResolvedValue(user)
    mockGetDecision.mockResolvedValue({ sessionId: "sess-abc", status: "Approved", vendorData: null })
    await expect(confirmKyc("foo@bar.com", "sess-abc")).rejects.toMatchObject({ status: 502 })
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })

  it("rejects mismatched vendor data", async () => {
    mockFindByEmail.mockResolvedValue(user)
    mockGetDecision.mockResolvedValue({ sessionId: "sess-abc", status: "Approved", vendorData: "other@bar.com" })
    await expect(confirmKyc("foo@bar.com", "sess-abc")).rejects.toMatchObject({ status: 403 })
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })

  it("uses getDecision directly when it succeeds (happy path)", async () => {
    mockFindByEmail.mockResolvedValue(user)
    mockGetDecision.mockResolvedValue({ status: "Approved", sessionId: "sess-abc", vendorData: "foo@bar.com" })

    const result = await confirmKyc("foo@bar.com", "sess-abc")

    expect(mockGetDecision).toHaveBeenCalledWith("sess-abc")
    expect(mockGetSessionStatus).not.toHaveBeenCalled()
    expect(mockUpdateUserKycStatus).toHaveBeenCalledWith("foo@bar.com", {
      kycStatus: "APPROVED",
      kycVerifiedAt: expect.any(Date),
      diditVerificationId: "sess-abc",
    })
    expect(result).toEqual({ status: "APPROVED", sessionId: "sess-abc" })
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
      diditVerificationId: "sess-abc",
    })

    const result = await getKycStatus("foo@bar.com")

    expect(result).toEqual({
      kycStatus: "APPROVED",
      kycVerifiedAt: new Date("2026-06-07T12:00:00Z"),
      diditVerificationId: "sess-abc",
    })
  })

  it("defaults to NOT_STARTED when kycStatus is not set", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-uuid-123",
      email: "foo@bar.com",
      kycStatus: null,
      kycVerifiedAt: null,
      diditVerificationId: null,
    })

    const result = await getKycStatus("foo@bar.com")

    expect(result).toEqual({
      kycStatus: "NOT_STARTED",
      kycVerifiedAt: null,
      diditVerificationId: null,
    })
  })

  it("throws 404 when the user is not found", async () => {
    mockFindByEmail.mockResolvedValue(null)

    await expect(getKycStatus("unknown@bar.com")).rejects.toMatchObject({
      status: 404,
      message: "Usuario autenticado no encontrado en la base de datos",
    })
  })

  it("updates DB and returns new status when Didit reports a change via getDecision", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-uuid-123",
      email: "foo@bar.com",
      kycStatus: "IN_REVIEW",
      kycVerifiedAt: null,
      diditVerificationId: "sess-abc",
    })
    mockGetDecision.mockResolvedValue({ status: "Approved" })
    mockUpdateUserKycStatus.mockResolvedValue({})

    const result = await getKycStatus("foo@bar.com")

    expect(mockGetDecision).toHaveBeenCalledWith("sess-abc")
    expect(mockUpdateUserKycStatus).toHaveBeenCalledWith("foo@bar.com", {
      kycStatus: "APPROVED",
      kycVerifiedAt: expect.any(Date),
      diditVerificationId: "sess-abc",
    })
    expect(result.kycStatus).toBe("APPROVED")
  })

  it("falls back to getSessionStatus when getDecision fails and updates on change", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-uuid-123",
      email: "foo@bar.com",
      kycStatus: "IN_REVIEW",
      kycVerifiedAt: null,
      diditVerificationId: "sess-abc",
    })
    mockGetDecision.mockRejectedValue(new Error("not found"))
    mockGetSessionStatus.mockResolvedValue({ status: "Approved" })
    mockUpdateUserKycStatus.mockResolvedValue({})

    const result = await getKycStatus("foo@bar.com")

    expect(mockGetSessionStatus).toHaveBeenCalledWith("sess-abc")
    expect(mockUpdateUserKycStatus).toHaveBeenCalled()
    expect(result.kycStatus).toBe("APPROVED")
  })

  it("does not update DB when Didit returns the same status", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-uuid-123",
      email: "foo@bar.com",
      kycStatus: "APPROVED",
      kycVerifiedAt: new Date("2026-06-07T12:00:00Z"),
      diditVerificationId: "sess-abc",
    })
    mockGetDecision.mockResolvedValue({ status: "Approved" })

    const result = await getKycStatus("foo@bar.com")

    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
    expect(result.kycStatus).toBe("APPROVED")
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

describe("getKycDecisionForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the decision when the session belongs to the user", async () => {
    mockFindByEmail.mockResolvedValue({ email: "foo@bar.com", diditVerificationId: "sess-owned" })
    mockGetDecision.mockResolvedValue({
      sessionId: "sess-owned",
      status: "Approved",
      sessionKind: "user",
      vendorData: null,
      idVerifications: [],
      livenessChecks: [],
      faceMatches: [],
      amlScreenings: [],
    })

    const result = await getKycDecisionForUser("foo@bar.com", "sess-owned")

    expect(result.sessionId).toBe("sess-owned")
    expect(mockGetDecision).toHaveBeenCalledWith("sess-owned")
  })

  it("rejects a session that belongs to another user", async () => {
    mockFindByEmail.mockResolvedValue({ email: "foo@bar.com", diditVerificationId: "sess-owned" })

    await expect(getKycDecisionForUser("foo@bar.com", "sess-other")).rejects.toMatchObject({ status: 403 })
    expect(mockGetDecision).not.toHaveBeenCalled()
  })
})

describe("handleKycWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("updates DB when status changes", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-1",
      email: "foo@bar.com",
      kycStatus: "IN_REVIEW",
      diditVerificationId: "sess-abc",
    })

    const result = await handleKycWebhook({
      event_id: "evt-1",
      webhook_type: "status.updated",
      timestamp: Math.floor(Date.now() / 1000),
      session_id: "sess-abc",
      status: "Approved",
      vendor_data: "foo@bar.com",
    })

    expect(result).toEqual({ processed: true })
    expect(mockUpdateUserKycStatus).toHaveBeenCalledWith("foo@bar.com", {
      kycStatus: "APPROVED",
      kycVerifiedAt: expect.any(Date),
      diditVerificationId: "sess-abc",
    })
  })

  it("skips DB write when status is already the same (idempotent)", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-1",
      email: "foo@bar.com",
      kycStatus: "APPROVED",
      diditVerificationId: "sess-abc",
    })

    const result = await handleKycWebhook({
      event_id: "evt-2",
      webhook_type: "status.updated",
      timestamp: Math.floor(Date.now() / 1000),
      session_id: "sess-abc",
      status: "Approved",
      vendor_data: "foo@bar.com",
    })

    expect(result).toEqual({ processed: false })
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })

  it("ignores non-status.updated webhook types", async () => {
    const result = await handleKycWebhook({
      event_id: "evt-3",
      webhook_type: "session.created",
      timestamp: Math.floor(Date.now() / 1000),
      session_id: "sess-abc",
      status: "Approved",
      vendor_data: "foo@bar.com",
    })

    expect(result).toEqual({ processed: false })
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })

  it("maps 'Not Finished' to IN_REVIEW", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-1",
      email: "foo@bar.com",
      kycStatus: "NOT_STARTED",
      diditVerificationId: "sess-abc",
    })

    const result = await handleKycWebhook({
      event_id: "evt-4",
      webhook_type: "status.updated",
      timestamp: Math.floor(Date.now() / 1000),
      session_id: "sess-abc",
      status: "Not Finished",
      vendor_data: "foo@bar.com",
    })

    expect(result).toEqual({ processed: true })
    expect(mockUpdateUserKycStatus).toHaveBeenCalledWith("foo@bar.com", {
      kycStatus: "IN_REVIEW",
      kycVerifiedAt: null,
      diditVerificationId: "sess-abc",
    })
  })

  it("returns processed: false when vendor_data is missing", async () => {
    const result = await handleKycWebhook({
      event_id: "evt-5",
      webhook_type: "status.updated",
      timestamp: Math.floor(Date.now() / 1000),
      session_id: "sess-abc",
      status: "Approved",
    })

    expect(result).toEqual({ processed: false })
    expect(mockFindByEmail).not.toHaveBeenCalled()
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })

  it("returns processed: false when user is not found", async () => {
    mockFindByEmail.mockResolvedValue(null)

    const result = await handleKycWebhook({
      event_id: "evt-6",
      webhook_type: "status.updated",
      timestamp: Math.floor(Date.now() / 1000),
      session_id: "sess-abc",
      status: "Approved",
      vendor_data: "unknown@bar.com",
    })

    expect(result).toEqual({ processed: false })
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })

  it("ignores a webhook for an old session", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-1",
      email: "foo@bar.com",
      kycStatus: "IN_REVIEW",
      diditVerificationId: "sess-current",
    })

    const result = await handleKycWebhook({
      event_id: "evt-old",
      webhook_type: "status.updated",
      timestamp: Math.floor(Date.now() / 1000),
      session_id: "sess-old",
      status: "Approved",
      vendor_data: "foo@bar.com",
    })

    expect(result).toEqual({ processed: false })
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })

  it("does not downgrade an approved user from a late webhook", async () => {
    mockFindByEmail.mockResolvedValue({
      id: "user-1",
      email: "foo@bar.com",
      kycStatus: "APPROVED",
      diditVerificationId: "sess-abc",
    })

    const result = await handleKycWebhook({
      event_id: "evt-late",
      webhook_type: "status.updated",
      timestamp: Math.floor(Date.now() / 1000),
      session_id: "sess-abc",
      status: "In Review",
      vendor_data: "foo@bar.com",
    })

    expect(result).toEqual({ processed: false })
    expect(mockUpdateUserKycStatus).not.toHaveBeenCalled()
  })
})
