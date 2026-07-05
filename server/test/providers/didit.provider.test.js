import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createDiditSession, getSessionStatus, getDecision } from "../../src/infrastructure/providers/didit.provider.js";
const mockFetch = vi.fn();
const DIDIT_URL = "https://verification.didit.me/v3/session/";
beforeEach(() => {
    vi.stubEnv("DIDIT_API_KEY", "test-api-key");
    vi.stubEnv("DIDIT_WORKFLOW_ID", "test-workflow-id");
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
});
afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});
describe("createDiditSession", () => {
    it("sends a POST to Didit with the right URL, headers and body", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                session_id: "sess-123",
                url: "https://verify.didit.me/session/sess-123",
            }),
        });
        await createDiditSession("user-uuid-abc");
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toBe(DIDIT_URL);
        expect(init.method).toBe("POST");
        expect(init.headers).toEqual({
            "x-api-key": "test-api-key",
            "Content-Type": "application/json",
            Accept: "application/json",
        });
        expect(JSON.parse(init.body)).toEqual({
            workflow_id: "test-workflow-id",
            vendor_data: "user-uuid-abc",
            expected_details: { id_country: "ARG" },
        });
    });
    it("omits callback and callback_method from the body", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                session_id: "sess-1",
                url: "https://verify.didit.me/session/sess-1",
            }),
        });
        await createDiditSession("user-1");
        const [, init] = mockFetch.mock.calls[0];
        const body = JSON.parse(init.body);
        expect(body).not.toHaveProperty("callback");
        expect(body).not.toHaveProperty("callback_method");
        expect(body).toEqual({
            workflow_id: "test-workflow-id",
            vendor_data: "user-1",
            expected_details: { id_country: "ARG" },
        });
    });
    it("uses an AbortSignal so the request can be cancelled", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                session_id: "sess-1",
                url: "https://verify.didit.me/session/sess-1",
            }),
        });
        await createDiditSession("user-1");
        const [, init] = mockFetch.mock.calls[0];
        expect(init.signal).toBeDefined();
        expect(init.signal).toBeInstanceOf(AbortSignal);
    });
    it("returns { sessionUrl, sessionId } on success", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                session_id: "sess-xyz",
                url: "https://verify.didit.me/session/sess-xyz",
            }),
        });
        const result = await createDiditSession("user-1");
        expect(result).toEqual({
            sessionId: "sess-xyz",
            sessionUrl: "https://verify.didit.me/session/sess-xyz",
        });
    });
    it("throws 502 with friendly message when Didit returns non-OK", async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 400,
            text: async () => '{"detail":"You don\'t have enough credits"}',
        });
        await expect(createDiditSession("user-1")).rejects.toMatchObject({
            status: 502,
            message: "El servicio de verificación rechazó la solicitud",
        });
    });
    it("throws 502 when Didit returns 5xx", async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 503,
            text: async () => "Service Unavailable",
        });
        await expect(createDiditSession("user-1")).rejects.toMatchObject({
            status: 502,
        });
    });
    it("throws 502 when fetch itself throws (network error)", async () => {
        mockFetch.mockRejectedValue(new Error("network down"));
        await expect(createDiditSession("user-1")).rejects.toMatchObject({
            status: 502,
            message: "No se pudo contactar al servicio de verificación",
        });
    });
    it("throws 502 when fetch is aborted (timeout)", async () => {
        const abortError = new Error("The operation was aborted");
        abortError.name = "AbortError";
        mockFetch.mockRejectedValue(abortError);
        await expect(createDiditSession("user-1")).rejects.toMatchObject({
            status: 502,
            message: "No se pudo contactar al servicio de verificación",
        });
    });
    it("throws 500 when DIDIT_API_KEY is not set", async () => {
        vi.stubEnv("DIDIT_API_KEY", "");
        await expect(createDiditSession("user-1")).rejects.toMatchObject({
            status: 500,
            message: "DIDIT_API_KEY is not configured",
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });
    it("throws 500 when DIDIT_WORKFLOW_ID is not set", async () => {
        vi.stubEnv("DIDIT_WORKFLOW_ID", "");
        await expect(createDiditSession("user-1")).rejects.toMatchObject({
            status: 500,
            message: "DIDIT_WORKFLOW_ID is not configured",
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });
    it("throws 502 when response is missing url", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ session_id: "sess-1" }),
        });
        await expect(createDiditSession("user-1")).rejects.toMatchObject({
            status: 502,
            message: "Respuesta inválida del servicio de verificación",
        });
    });
    it("throws 502 when response is missing session_id", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ url: "https://verify.didit.me/session/x" }),
        });
        await expect(createDiditSession("user-1")).rejects.toMatchObject({
            status: 502,
            message: "Respuesta inválida del servicio de verificación",
        });
    });
    it("does not throw when the error body is unreadable", async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => {
                throw new Error("body unreadable");
            },
        });
        await expect(createDiditSession("user-1")).rejects.toMatchObject({
            status: 502,
            message: "El servicio de verificación rechazó la solicitud",
        });
    });
});
describe("getSessionStatus", () => {
    it("sends a GET with x-api-key and returns the session", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                session_id: "sess-abc",
                status: "Approved",
                url: "https://verify.didit.me/session/sess-abc",
            }),
        });
        const result = await getSessionStatus("sess-abc");
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toBe("https://verification.didit.me/v3/session/sess-abc/");
        expect(init.method).toBe("GET");
        expect(init.headers).toMatchObject({ "x-api-key": "test-api-key" });
        expect(result).toEqual({
            sessionId: "sess-abc",
            status: "Approved",
            url: "https://verify.didit.me/session/sess-abc",
        });
    });
    it("defaults to UNKNOWN when status is missing", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ session_id: "sess-1" }),
        });
        const result = await getSessionStatus("sess-1");
        expect(result.status).toBe("UNKNOWN");
    });
    it("throws 404 when Didit returns 404", async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 404,
            text: async () => "Not Found",
        });
        await expect(getSessionStatus("sess-nonexistent")).rejects.toMatchObject({
            status: 404,
            message: "La sesión de verificación no existe",
        });
    });
    it("throws 502 when Didit returns 5xx", async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => "Internal Server Error",
        });
        await expect(getSessionStatus("sess-1")).rejects.toMatchObject({ status: 502 });
    });
    it("throws 502 when fetch itself throws", async () => {
        mockFetch.mockRejectedValue(new Error("network error"));
        await expect(getSessionStatus("sess-1")).rejects.toMatchObject({
            status: 502,
            message: "No se pudo contactar al servicio de verificación",
        });
    });
    it("throws 500 when DIDIT_API_KEY is not set", async () => {
        vi.stubEnv("DIDIT_API_KEY", "");
        await expect(getSessionStatus("sess-1")).rejects.toMatchObject({
            status: 500,
            message: "DIDIT_API_KEY is not configured",
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });
    it("throws 502 when response is missing session_id", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ status: "Approved" }),
        });
        await expect(getSessionStatus("sess-1")).rejects.toMatchObject({
            status: 502,
            message: "Respuesta inválida del servicio de verificación",
        });
    });
});
describe("getDecision", () => {
    it("sends a GET to /decision/ endpoint and returns mapped data", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                session_id: "sess-decision-1",
                status: "Approved",
                session_kind: "user",
                vendor_data: "user-uuid-42",
                id_verifications: [{ status: "Approved", full_name: "Juan Pérez" }],
                liveness_checks: [{ status: "Approved", score: 89 }],
                face_matches: [{ status: "Approved", score: 94 }],
                aml_screenings: [{ status: "Approved", total_hits: 0 }],
            }),
        });
        const result = await getDecision("sess-decision-1");
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toBe("https://verification.didit.me/v3/session/sess-decision-1/decision/");
        expect(init.method).toBe("GET");
        expect(init.headers).toMatchObject({ "x-api-key": "test-api-key" });
        expect(result).toEqual({
            sessionId: "sess-decision-1",
            status: "Approved",
            sessionKind: "user",
            vendorData: "user-uuid-42",
            idVerifications: [{ status: "Approved", full_name: "Juan Pérez" }],
            livenessChecks: [{ status: "Approved", score: 89 }],
            faceMatches: [{ status: "Approved", score: 94 }],
            amlScreenings: [{ status: "Approved", total_hits: 0 }],
        });
    });
    it("defaults arrays to empty when fields are missing", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                session_id: "sess-1",
                status: "In Review",
                session_kind: "user",
            }),
        });
        const result = await getDecision("sess-1");
        expect(result.vendorData).toBeNull();
        expect(result.idVerifications).toEqual([]);
        expect(result.livenessChecks).toEqual([]);
        expect(result.faceMatches).toEqual([]);
        expect(result.amlScreenings).toEqual([]);
    });
    it("throws 404 when Didit returns 404", async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 404,
            text: async () => "Not Found",
        });
        await expect(getDecision("sess-nonexistent")).rejects.toMatchObject({
            status: 404,
            message: "La sesión de verificación no existe",
        });
    });
    it("throws 502 when Didit returns 5xx", async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => "Internal Server Error",
        });
        await expect(getDecision("sess-1")).rejects.toMatchObject({ status: 502 });
    });
    it("throws 502 when fetch itself throws", async () => {
        mockFetch.mockRejectedValue(new Error("network error"));
        await expect(getDecision("sess-1")).rejects.toMatchObject({
            status: 502,
            message: "No se pudo contactar al servicio de verificación",
        });
    });
    it("throws 500 when DIDIT_API_KEY is not set", async () => {
        vi.stubEnv("DIDIT_API_KEY", "");
        await expect(getDecision("sess-1")).rejects.toMatchObject({
            status: 500,
            message: "DIDIT_API_KEY is not configured",
        });
        expect(mockFetch).not.toHaveBeenCalled();
    });
    it("throws 502 when response is missing session_id", async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ status: "Approved" }),
        });
        await expect(getDecision("sess-1")).rejects.toMatchObject({
            status: 502,
            message: "Respuesta inválida del servicio de verificación",
        });
    });
});
