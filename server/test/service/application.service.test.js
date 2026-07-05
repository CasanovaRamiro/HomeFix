import { describe, it, expect, vi, beforeEach } from "vitest";
import * as applicationData from "../../src/infrastructure/database/application.database.js";
import * as postData from "../../src/infrastructure/database/post.database.js";
import * as userDatabase from "../../src/infrastructure/database/user.database.js";
import * as userService from "../../src/domain/services/user.service.js";
import { PostType } from "../../src/domain/types/postType.js";
import { acceptApplication, rejectApplication, dismissWorker, applyToPost, applyToSubcontract, getMyApplications, cancelApplication, getPostApplications } from "../../src/domain/services/application.service.js";
vi.mock("../../src/infrastructure/database/application.database.js", () => ({
    findApplicationsByWorker: vi.fn(),
    findApplication: vi.fn(),
    createApplication: vi.fn(),
    findApplicationById: vi.fn(),
    updateApplicationStatus: vi.fn(),
    acceptApplicationWithDate: vi.fn(),
    deleteApplication: vi.fn(),
    findApplicationsByPost: vi.fn(),
}));
vi.mock("../../src/infrastructure/database/post.database.js", () => ({
    findPostById: vi.fn(),
    updatePostStatus: vi.fn(),
    createPost: vi.fn(),
    findPostsByUser: vi.fn(),
    findAvailablePosts: vi.fn(),
    searchByDistance: vi.fn(),
}));
vi.mock("../../src/infrastructure/database/user.database.js", () => ({
    findUserById: vi.fn(),
}));
vi.mock("../../src/infrastructure/providers/telegram.provider.js", () => ({
    createTelegramProvider: vi.fn(() => ({ sendMessage: vi.fn() })),
}));
vi.mock("../../src/domain/services/notification.service.js", () => ({
    notifyUser: vi.fn(),
}));
const mockPrisma = vi.hoisted(() => {
    const fn = vi.fn();
    return {
        fn_updateMany: fn,
        application: { updateMany: fn },
        $transaction: vi.fn((cb) => cb({
            application: { updateMany: fn },
        })),
    };
});
vi.mock("../../src/lib/prisma.js", () => ({
    default: mockPrisma,
}));
vi.mock("../../src/domain/services/user.service.js", () => ({
    getClientRating: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());
const mockApplication = {
    id: "app-1",
    workerId: "worker-1",
    postId: "post-1",
    categoryId: null,
    subcontractGroupId: null,
    status: "Pending",
    createdAt: new Date(),
    updatedAt: new Date(),
    message: null,
    availableDays: null,
    availableTimeFrom: null,
    availableTimeTo: null,
    chargesVisit: false,
    visitCost: null,
    offeredDuration: null,
    scheduledDate: null,
    post: { userId: "client-1", title: "Test post", status: "Active", type: "Post", subcontractGroupId: null },
    category: null,
};
describe("acceptApplication", () => {
    it("returns accepted application when valid", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication);
        vi.mocked(postData.updatePostStatus).mockResolvedValue({});
        mockPrisma.application.updateMany.mockResolvedValue({ count: 1 });
        const result = await acceptApplication("client-1", "app-1");
        expect(result.status).toBe("Accepted");
        expect(mockPrisma.application.updateMany).toHaveBeenCalledWith({
            where: { id: "app-1", status: "Pending" },
            data: { status: "Accepted", scheduledDate: null },
        });
        expect(postData.updatePostStatus).toHaveBeenCalledWith("post-1", "In progress");
    });
    it("throws 404 if application does not exist", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue(null);
        await expect(acceptApplication("client-1", "app-1")).rejects.toMatchObject({ status: 404 });
    });
    it("throws 403 if requester is not the post owner", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication);
        await expect(acceptApplication("otro-cliente", "app-1")).rejects.toMatchObject({ status: 403 });
    });
    it("throws 400 if application is not Pending", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue({ ...mockApplication, status: "Accepted" });
        await expect(acceptApplication("client-1", "app-1")).rejects.toMatchObject({ status: 400 });
    });
    it("throws 400 if post is not Active", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue({
            ...mockApplication,
            post: { userId: "client-1", title: "Test post", status: "In progress", type: "Post", subcontractGroupId: null },
        });
        await expect(acceptApplication("client-1", "app-1")).rejects.toMatchObject({ status: 400 });
    });
    it("throws 400 if post is Paused", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue({
            ...mockApplication,
            post: { userId: "client-1", title: "Test post", status: "Paused", type: "Post", subcontractGroupId: null },
        });
        await expect(acceptApplication("client-1", "app-1")).rejects.toMatchObject({ status: 400 });
    });
    it("throws 400 when application already accepted in another position of the same subcontract group", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue({
            ...mockApplication,
            post: { userId: "client-1", title: "Test post", status: "Active", type: "SubContract", subcontractGroupId: null },
            category: { id: "cat-1", quantity: 2, filledCount: 0 },
        });
        mockPrisma.application.updateMany.mockRejectedValue(Object.assign(new Error('Unique constraint failed'), { code: 'P2002' }));
        await expect(acceptApplication("client-1", "app-1")).rejects.toMatchObject({ status: 400, message: 'El trabajador ya fue contratado para otro rubro' });
    });
});
describe("applyToPost", () => {
    const validInput = {
        postId: "post-1",
        availableDays: ["2026-06-01", "2026-06-15"],
        availableTimeFrom: "09:00",
        availableTimeTo: "18:00",
        chargesVisit: false,
    };
    const mockPost = {
        id: "post-1", userId: "client-1", title: "Test post", status: "Active",
        description: "", address: "",
        startDate: new Date("2026-06-01T00:00:00.000Z"),
        endDate: new Date("2026-06-30T00:00:00.000Z"),
        createdAt: new Date(), images: [], latitude: null, longitude: null,
        categories: [], user: { id: "client-1", name: "Client", surname: "Test" },
    };
    const mockCreated = {
        id: "app-new", status: "Pending", workerId: "worker-1", postId: "post-1",
        categoryId: null, subcontractGroupId: null, message: null, availableDays: null, availableTimeFrom: null, availableTimeTo: null,
        chargesVisit: false, visitCost: null, offeredDuration: null, scheduledDate: null, createdAt: new Date(), updatedAt: new Date(),
    };
    beforeEach(() => {
        vi.mocked(postData.findPostById).mockResolvedValue(mockPost);
        vi.mocked(applicationData.findApplication).mockResolvedValue(null);
        vi.mocked(applicationData.createApplication).mockResolvedValue(mockCreated);
        vi.mocked(userDatabase.findUserById).mockResolvedValue({ id: "worker-1", name: "Juan", email: "juan@test.com", phone: null, telegramChatId: null });
    });
    it("crea la postulaciÃ³n y retorna id, status y mensaje de Ã©xito", async () => {
        const result = await applyToPost("worker-1", validInput);
        expect(result).toEqual({ id: "app-new", status: "Pending", message: "Application successful" });
        expect(applicationData.createApplication).toHaveBeenCalledWith("worker-1", validInput);
    });
    it("lanza 404 si el post no existe", async () => {
        vi.mocked(postData.findPostById).mockResolvedValue(null);
        await expect(applyToPost("worker-1", validInput)).rejects.toMatchObject({ status: 404 });
    });
    it("lanza 400 si el post no estÃ¡ Active", async () => {
        vi.mocked(postData.findPostById).mockResolvedValue({ ...mockPost, status: "Completed" });
        await expect(applyToPost("worker-1", validInput)).rejects.toMatchObject({ status: 400 });
    });
    it("lanza 409 si el worker ya se postulÃ³ al post", async () => {
        vi.mocked(applicationData.findApplication).mockResolvedValue({
            id: "existing-app", status: "Pending", workerId: "worker-1", postId: "post-1",
            categoryId: null, subcontractGroupId: null, message: null, availableDays: null, availableTimeFrom: null, availableTimeTo: null,
            chargesVisit: false, visitCost: null, offeredDuration: null, scheduledDate: null, createdAt: new Date(), updatedAt: new Date(),
        });
        await expect(applyToPost("worker-1", validInput)).rejects.toMatchObject({ status: 409 });
    });
    it("lanza 400 cuando chargesVisit es true y visitCost no se envÃ­a", async () => {
        await expect(applyToPost("worker-1", { ...validInput, chargesVisit: true }))
            .rejects.toMatchObject({ status: 400 });
    });
    it("lanza 400 cuando chargesVisit es true y visitCost es 0", async () => {
        await expect(applyToPost("worker-1", { ...validInput, chargesVisit: true, visitCost: 0 }))
            .rejects.toMatchObject({ status: 400 });
    });
    it("lanza 400 cuando chargesVisit es true y visitCost es negativo", async () => {
        await expect(applyToPost("worker-1", { ...validInput, chargesVisit: true, visitCost: -100 }))
            .rejects.toMatchObject({ status: 400 });
    });
    it("acepta la postulaciÃ³n cuando chargesVisit es true y visitCost es positivo", async () => {
        const result = await applyToPost("worker-1", { ...validInput, chargesVisit: true, visitCost: 500 });
        expect(result.status).toBe("Pending");
        expect(applicationData.createApplication).toHaveBeenCalledWith("worker-1", expect.objectContaining({ chargesVisit: true, visitCost: 500 }));
    });
    it("acepta la postulaciÃ³n sin visitCost cuando chargesVisit es false", async () => {
        const result = await applyToPost("worker-1", validInput);
        expect(result.status).toBe("Pending");
    });
    it("lanza 400 si availableDays contiene una fecha anterior al startDate", async () => {
        const input = { ...validInput, availableDays: ["2026-05-31"] };
        await expect(applyToPost("worker-1", input)).rejects.toMatchObject({ status: 400 });
    });
    it("lanza 400 si availableDays contiene una fecha posterior al endDate", async () => {
        const input = { ...validInput, availableDays: ["2026-07-01"] };
        await expect(applyToPost("worker-1", input)).rejects.toMatchObject({ status: 400 });
    });
    it("lanza 400 si hay fechas dentro y fuera del rango", async () => {
        const input = { ...validInput, availableDays: ["2026-06-15", "2026-07-01"] };
        await expect(applyToPost("worker-1", input)).rejects.toMatchObject({ status: 400 });
    });
    it("acepta availableDays que estÃ©n exactamente en los lÃ­mites del rango", async () => {
        const input = { ...validInput, availableDays: ["2026-06-01", "2026-06-30"] };
        const result = await applyToPost("worker-1", input);
        expect(result.status).toBe("Pending");
    });
    it("acepta postulaciÃ³n sin availableDays si no se envÃ­an", async () => {
        const { availableDays: _, ...input } = validInput;
        const result = await applyToPost("worker-1", input);
        expect(result.status).toBe("Pending");
    });
    it("acepta postulaciÃ³n con availableDays vacÃ­o", async () => {
        const input = { ...validInput, availableDays: [] };
        const result = await applyToPost("worker-1", input);
        expect(result.status).toBe("Pending");
    });
});
describe("applyToSubcontract", () => {
    const validInput = {
        postId: "subcontract-1",
        categoryId: "cat-1",
        availableDays: ["Lunes", "Martes"],
        availableTimeFrom: "09:00",
        availableTimeTo: "18:00",
        chargesVisit: false,
    };
    const mockSubcontract = {
        id: "subcontract-1",
        userId: "worker-creator",
        type: PostType.SubContract,
        title: "Busco albaÃ±il",
        status: "Active",
        description: "",
        address: "",
        startDate: new Date(),
        endDate: new Date(),
        createdAt: new Date(),
        images: [],
        latitude: null,
        longitude: null,
        isEmergency: false,
        emergencyExpiresAt: null,
        subcontractGroupId: "group-1",
        categories: [
            { id: "cat-1", name: "AlbaÃ±il", quantity: 2, filledCount: 0, roleDescription: "AlbaÃ±ilerÃ­a general" },
        ],
        user: { id: "worker-creator", name: "Worker", surname: "Creator" },
    };
    const mockCreated = {
        id: "app-new", status: "Pending", workerId: "worker-1", postId: "subcontract-1",
        categoryId: "cat-1", subcontractGroupId: "group-1", message: null, availableDays: null, availableTimeFrom: null, availableTimeTo: null,
        chargesVisit: false, visitCost: null, offeredDuration: null, scheduledDate: null, createdAt: new Date(), updatedAt: new Date(),
    };
    beforeEach(() => {
        vi.mocked(postData.findPostById).mockResolvedValue(mockSubcontract);
        vi.mocked(applicationData.findApplication).mockResolvedValue(null);
        vi.mocked(applicationData.createApplication).mockResolvedValue(mockCreated);
        vi.mocked(userDatabase.findUserById).mockResolvedValue({ id: "worker-1", name: "Juan", email: "juan@test.com", phone: null, telegramChatId: null });
    });
    it("crea la postulaciÃ³n y retorna id, status y mensaje de Ã©xito", async () => {
        const result = await applyToSubcontract("worker-1", validInput);
        expect(result).toEqual({ id: "app-new", status: "Pending", message: "Postulación a subcontrato exitosa" });
        expect(applicationData.createApplication).toHaveBeenCalledWith("worker-1", {
            ...validInput,
            subcontractGroupId: "group-1",
        });
    });
    it("lanza 404 si el subcontract no existe", async () => {
        vi.mocked(postData.findPostById).mockResolvedValue(null);
        await expect(applyToSubcontract("worker-1", validInput)).rejects.toMatchObject({ status: 404 });
    });
    it("lanza 400 si el post no es de tipo SubContract", async () => {
        vi.mocked(postData.findPostById).mockResolvedValue({ ...mockSubcontract, type: PostType.Post });
        await expect(applyToSubcontract("worker-1", validInput)).rejects.toMatchObject({ status: 400 });
    });
    it("lanza 400 si el subcontract no estÃ¡ Active", async () => {
        vi.mocked(postData.findPostById).mockResolvedValue({ ...mockSubcontract, status: "Completed" });
        await expect(applyToSubcontract("worker-1", validInput)).rejects.toMatchObject({ status: 400 });
    });
    it("lanza 400 si el worker se postula a su propio subcontract", async () => {
        await expect(applyToSubcontract("worker-creator", validInput)).rejects.toMatchObject({ status: 400 });
    });
    it("lanza 400 si no hay vacantes disponibles", async () => {
        vi.mocked(postData.findPostById).mockResolvedValue({
            ...mockSubcontract,
            categories: [
                { id: "cat-1", name: "AlbaÃ±il", quantity: 2, filledCount: 2, roleDescription: "AlbaÃ±ilerÃ­a general" },
            ],
        });
        await expect(applyToSubcontract("worker-1", validInput)).rejects.toMatchObject({ status: 400 });
    });
    it("lanza 409 si el worker ya se postuló a este rubro", async () => {
        vi.mocked(applicationData.findApplication).mockResolvedValue({
            id: "existing-app", status: "Pending", workerId: "worker-1", postId: "subcontract-1",
            categoryId: "pc-1", subcontractGroupId: "group-1", message: null, availableDays: null, availableTimeFrom: null, availableTimeTo: null,
            chargesVisit: false, visitCost: null, offeredDuration: null, scheduledDate: null, createdAt: new Date(), updatedAt: new Date(),
        });
        await expect(applyToSubcontract("worker-1", validInput)).rejects.toMatchObject({ status: 409 });
    });
    it("lanza 400 cuando chargesVisit es true y visitCost no se envÃ­a", async () => {
        await expect(applyToSubcontract("worker-1", { ...validInput, chargesVisit: true }))
            .rejects.toMatchObject({ status: 400 });
    });
    it("lanza 400 cuando chargesVisit es true y visitCost es 0", async () => {
        await expect(applyToSubcontract("worker-1", { ...validInput, chargesVisit: true, visitCost: 0 }))
            .rejects.toMatchObject({ status: 400 });
    });
    it("lanza 400 cuando chargesVisit es true y visitCost es negativo", async () => {
        await expect(applyToSubcontract("worker-1", { ...validInput, chargesVisit: true, visitCost: -100 }))
            .rejects.toMatchObject({ status: 400 });
    });
    it("acepta la postulaciÃ³n cuando chargesVisit es true y visitCost es positivo", async () => {
        const result = await applyToSubcontract("worker-1", { ...validInput, chargesVisit: true, visitCost: 500 });
        expect(result.status).toBe("Pending");
        expect(applicationData.createApplication).toHaveBeenCalledWith("worker-1", expect.objectContaining({ chargesVisit: true, visitCost: 500, subcontractGroupId: "group-1" }));
    });
    it("lanza 400 si el categoryId no existe en el subcontract", async () => {
        await expect(applyToSubcontract("worker-1", { ...validInput, categoryId: "cat-nonexistent" }))
            .rejects.toMatchObject({ status: 400 });
    });
    it("pasa subcontractGroupId a createApplication", async () => {
        vi.mocked(applicationData.createApplication).mockResolvedValue(mockCreated);
        await applyToSubcontract("worker-1", validInput);
        expect(applicationData.createApplication).toHaveBeenCalledWith("worker-1", expect.objectContaining({ subcontractGroupId: "group-1" }));
    });
    it("lanza 400 si filledCount >= quantity", async () => {
        vi.mocked(postData.findPostById).mockResolvedValue({
            ...mockSubcontract,
            categories: [
                { id: "cat-1", name: "Albañil", quantity: 2, filledCount: 2, roleDescription: "Albañilería general" },
            ],
        });
        await expect(applyToSubcontract("worker-1", validInput)).rejects.toMatchObject({ status: 400 });
    });
});
describe("rejectApplication", () => {
    it("returns rejected application when valid", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication);
        vi.mocked(applicationData.updateApplicationStatus).mockResolvedValue({ ...mockApplication, status: "Rejected" });
        const result = await rejectApplication("client-1", "app-1");
        expect(result.status).toBe("Rejected");
        expect(applicationData.updateApplicationStatus).toHaveBeenCalledWith("app-1", "Rejected");
        expect(postData.updatePostStatus).not.toHaveBeenCalled();
    });
    it("throws 404 if application does not exist", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue(null);
        await expect(rejectApplication("client-1", "app-1")).rejects.toMatchObject({ status: 404 });
    });
    it("throws 403 if requester is not the post owner", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication);
        await expect(rejectApplication("otro-cliente", "app-1")).rejects.toMatchObject({ status: 403 });
    });
    it("throws 400 if application is not Pending", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue({ ...mockApplication, status: "Accepted" });
        await expect(rejectApplication("client-1", "app-1")).rejects.toMatchObject({ status: 400 });
    });
});
describe("dismissWorker", () => {
    const acceptedApplication = {
        ...mockApplication,
        status: "Accepted",
        post: { userId: "client-1", title: "Test post", status: "In progress", type: "Post", subcontractGroupId: null },
    };
    it("dismisses the worker and reopens the post when valid", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue(acceptedApplication);
        vi.mocked(applicationData.updateApplicationStatus).mockResolvedValue({ ...acceptedApplication, status: "Dismissed" });
        vi.mocked(postData.updatePostStatus).mockResolvedValue({});
        const result = await dismissWorker("client-1", "app-1");
        expect(result.status).toBe("Dismissed");
        expect(applicationData.updateApplicationStatus).toHaveBeenCalledWith("app-1", "Dismissed");
        expect(postData.updatePostStatus).toHaveBeenCalledWith("post-1", "Active");
    });
    it("throws 404 if application does not exist", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue(null);
        await expect(dismissWorker("client-1", "app-1")).rejects.toMatchObject({ status: 404 });
    });
    it("throws 403 if requester is not the post owner", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue(acceptedApplication);
        await expect(dismissWorker("otro-cliente", "app-1")).rejects.toMatchObject({ status: 403 });
    });
    it("throws 400 if application is not Accepted", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue({
            ...acceptedApplication,
            status: "Pending",
        });
        await expect(dismissWorker("client-1", "app-1")).rejects.toMatchObject({ status: 400 });
        expect(postData.updatePostStatus).not.toHaveBeenCalled();
    });
    it("throws 400 if post is not In progress", async () => {
        vi.mocked(applicationData.findApplicationById).mockResolvedValue({
            ...acceptedApplication,
            post: { userId: "client-1", title: "Test post", status: "Completed", type: "Post", subcontractGroupId: null },
        });
        await expect(dismissWorker("client-1", "app-1")).rejects.toMatchObject({ status: 400 });
        expect(postData.updatePostStatus).not.toHaveBeenCalled();
    });
});
describe("getMyApplications", () => {
    const mockApp = {
        id: "app-1",
        postId: "post-1",
        title: "Fix pipes",
        client: "Client One",
        clientId: "client-1",
        clientPhone: null,
        location: "Buenos Aires",
        appliedAt: new Date(),
        serviceDate: new Date(),
        status: "Pending",
        message: null,
    };
    it("returns applications enriched with client rating", async () => {
        vi.mocked(applicationData.findApplicationsByWorker).mockResolvedValue([mockApp]);
        vi.mocked(userService.getClientRating).mockResolvedValue({ averageRating: 4.5, reviewCount: 3 });
        const result = await getMyApplications("worker-1");
        expect(applicationData.findApplicationsByWorker).toHaveBeenCalledWith("worker-1");
        expect(userService.getClientRating).toHaveBeenCalledWith("client-1");
        expect(result[0].clientRating).toBe(4.5);
    });
    it("returns zero client rating when clientId is null", async () => {
        vi.mocked(applicationData.findApplicationsByWorker).mockResolvedValue([{ ...mockApp, clientId: null }]);
        const result = await getMyApplications("worker-1");
        expect(userService.getClientRating).not.toHaveBeenCalled();
        expect(result[0].clientRating).toBe(0);
    });
    it("returns empty array when worker has no applications", async () => {
        vi.mocked(applicationData.findApplicationsByWorker).mockResolvedValue([]);
        const result = await getMyApplications("worker-1");
        expect(result).toEqual([]);
    });
});
describe("cancelApplication", () => {
    it("cancels application successfully", async () => {
        vi.mocked(applicationData.deleteApplication).mockResolvedValue({ count: 1 });
        const result = await cancelApplication("worker-1", "app-1");
        expect(applicationData.deleteApplication).toHaveBeenCalledWith("worker-1", "app-1");
        expect(result.message).toBe("Postulación cancelada");
    });
    it("throws 404 when application is not found or not cancelable", async () => {
        vi.mocked(applicationData.deleteApplication).mockResolvedValue({ count: 0 });
        await expect(cancelApplication("worker-1", "app-1")).rejects.toMatchObject({ status: 404 });
    });
});
describe("getPostApplications", () => {
    const mockPost = {
        id: "post-1",
        userId: "client-1",
        title: "Fix pipes",
        status: "Active",
        description: "",
        address: "",
        startDate: new Date(),
        endDate: new Date(),
        createdAt: new Date(),
        images: [],
        latitude: null,
        longitude: null,
        categories: [],
        user: { id: "client-1", name: "Client", surname: "One" },
    };
    const mockPostApplications = [
        {
            applicationId: "app-1",
            workerId: "worker-1",
            name: "Worker One",
            photo: null,
            category: "Plumbing",
            address: "Buenos Aires",
            rating: 4.5,
            reviewCount: 5,
            jobCount: 10,
            status: "Pending",
            message: null,
            availableDays: ["Lunes"],
            availableTimeFrom: "09:00",
            availableTimeTo: "18:00",
            chargesVisit: false,
            visitCost: null,
            phone: null,
        },
    ];
    it("returns applications for the post owner", async () => {
        vi.mocked(postData.findPostById).mockResolvedValue(mockPost);
        vi.mocked(applicationData.findApplicationsByPost).mockResolvedValue(mockPostApplications);
        const result = await getPostApplications("client-1", "post-1");
        expect(postData.findPostById).toHaveBeenCalledWith("post-1");
        expect(applicationData.findApplicationsByPost).toHaveBeenCalledWith("post-1");
        expect(result).toEqual(mockPostApplications);
    });
    it("throws 404 when post does not exist", async () => {
        vi.mocked(postData.findPostById).mockResolvedValue(null);
        await expect(getPostApplications("client-1", "post-1")).rejects.toMatchObject({ status: 404 });
    });
    it("throws 403 when requester is not the post owner", async () => {
        vi.mocked(postData.findPostById).mockResolvedValue(mockPost);
        await expect(getPostApplications("other-client", "post-1")).rejects.toMatchObject({ status: 403 });
    });
});
