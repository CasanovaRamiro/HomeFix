import { describe, it, expect, vi, beforeEach } from "vitest"
import * as applicationData from "../../src/infrastructure/database/application.database.js"
import * as postData from "../../src/infrastructure/database/post.database.js"
import * as userDatabase from "../../src/infrastructure/database/user.database.js"
import { PostType } from "../../src/domain/types/postType.js"
import { acceptApplication, rejectApplication, dismissWorker, applyToPost, applyToSubcontract } from "../../src/domain/services/application.service.js"

vi.mock("../../src/infrastructure/database/application.database.js", () => ({
  findApplicationsByWorker: vi.fn(),
  findApplication: vi.fn(),
  createApplication: vi.fn(),
  findApplicationById: vi.fn(),
  updateApplicationStatus: vi.fn(),
}))

vi.mock("../../src/infrastructure/database/post.database.js", () => ({
  findPostById: vi.fn(),
  updatePostStatus: vi.fn(),
  createPost: vi.fn(),
  findPostsByUser: vi.fn(),
  findAvailablePosts: vi.fn(),
  searchByDistance: vi.fn(),
}))

vi.mock("../../src/infrastructure/database/user.database.js", () => ({
  findUserById: vi.fn(),
}))

vi.mock("../../src/infrastructure/providers/telegram.provider.js", () => ({
  createTelegramProvider: vi.fn(() => ({ sendMessage: vi.fn() })),
}))

vi.mock("../../src/domain/services/notification.service.js", () => ({
  notifyUser: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())

const mockApplication = {
  id: "app-1",
  workerId: "worker-1",
  postId: "post-1",
  status: "Pending",
  createdAt: new Date(),
  updatedAt: new Date(),
  message: null,
  availableDays: null,
  availableTimeFrom: null,
  availableTimeTo: null,
  chargesVisit: false,
  visitCost: null,
  post: { userId: "client-1", title: "Test post", status: "Active" },
}

describe("acceptApplication", () => {
  it("returns accepted application when valid", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication)
    vi.mocked(applicationData.updateApplicationStatus).mockResolvedValue({ ...mockApplication, status: "Accepted" })
    vi.mocked(postData.updatePostStatus).mockResolvedValue({} as never)

    const result = await acceptApplication("client-1", "app-1")

    expect(result.status).toBe("Accepted")
    expect(applicationData.updateApplicationStatus).toHaveBeenCalledWith("app-1", "Accepted")
    expect(postData.updatePostStatus).toHaveBeenCalledWith("post-1", "In progress")
  })

  it("throws 404 if application does not exist", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(null)

    await expect(acceptApplication("client-1", "app-1")).rejects.toMatchObject({ status: 404 })
  })

  it("throws 403 if requester is not the post owner", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication)

    await expect(acceptApplication("otro-cliente", "app-1")).rejects.toMatchObject({ status: 403 })
  })

  it("throws 400 if application is not Pending", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue({ ...mockApplication, status: "Accepted" })

    await expect(acceptApplication("client-1", "app-1")).rejects.toMatchObject({ status: 400 })
  })

  it("throws 400 if post is not Active", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue({
      ...mockApplication,
      post: { userId: "client-1", title: "Test post", status: "In progress" },
    })

    await expect(acceptApplication("client-1", "app-1")).rejects.toMatchObject({ status: 400 })
  })

  it("throws 400 if post is Paused", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue({
      ...mockApplication,
      post: { userId: "client-1", title: "Test post", status: "Paused" },
    })

    await expect(acceptApplication("client-1", "app-1")).rejects.toMatchObject({ status: 400 })
  })
})

describe("applyToPost", () => {
  const validInput = {
    postId: "post-1",
    availableDays: ["Lunes", "Martes"],
    availableTimeFrom: "09:00",
    availableTimeTo: "18:00",
    chargesVisit: false,
  }

  const mockPost = {
    id: "post-1", userId: "client-1", title: "Test post", status: "Active",
    description: "", address: "", startDate: new Date(), endDate: new Date(),
    createdAt: new Date(), images: [], latitude: null, longitude: null,
    categories: [], user: { id: "client-1", name: "Client", surname: "Test" },
  }
  const mockCreated = {
    id: "app-new", status: "Pending", workerId: "worker-1", postId: "post-1",
    message: null, availableDays: null, availableTimeFrom: null, availableTimeTo: null,
    chargesVisit: false, visitCost: null, createdAt: new Date(), updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.mocked(postData.findPostById).mockResolvedValue(mockPost)
    vi.mocked(applicationData.findApplication).mockResolvedValue(null)
    vi.mocked(applicationData.createApplication).mockResolvedValue(mockCreated)
    vi.mocked(userDatabase.findUserById).mockResolvedValue({ id: "worker-1", name: "Juan", email: "juan@test.com", phone: null, telegramChatId: null })
  })

  it("crea la postulación y retorna id, status y mensaje de éxito", async () => {
    const result = await applyToPost("worker-1", validInput)
    expect(result).toEqual({ id: "app-new", status: "Pending", message: "Application successful" })
    expect(applicationData.createApplication).toHaveBeenCalledWith("worker-1", validInput)
  })

  it("lanza 404 si el post no existe", async () => {
    vi.mocked(postData.findPostById).mockResolvedValue(null)
    await expect(applyToPost("worker-1", validInput)).rejects.toMatchObject({ status: 404 })
  })

  it("lanza 400 si el post no está Active", async () => {
    vi.mocked(postData.findPostById).mockResolvedValue({ ...mockPost, status: "Completed" })
    await expect(applyToPost("worker-1", validInput)).rejects.toMatchObject({ status: 400 })
  })

  it("lanza 409 si el worker ya se postuló al post", async () => {
    vi.mocked(applicationData.findApplication).mockResolvedValue({
      id: "existing-app", status: "Pending", workerId: "worker-1", postId: "post-1",
      message: null, availableDays: null, availableTimeFrom: null, availableTimeTo: null,
      chargesVisit: false, visitCost: null, createdAt: new Date(), updatedAt: new Date(),
    })
    await expect(applyToPost("worker-1", validInput)).rejects.toMatchObject({ status: 409 })
  })

  it("lanza 400 cuando chargesVisit es true y visitCost no se envía", async () => {
    await expect(applyToPost("worker-1", { ...validInput, chargesVisit: true }))
      .rejects.toMatchObject({ status: 400 })
  })

  it("lanza 400 cuando chargesVisit es true y visitCost es 0", async () => {
    await expect(applyToPost("worker-1", { ...validInput, chargesVisit: true, visitCost: 0 }))
      .rejects.toMatchObject({ status: 400 })
  })

  it("lanza 400 cuando chargesVisit es true y visitCost es negativo", async () => {
    await expect(applyToPost("worker-1", { ...validInput, chargesVisit: true, visitCost: -100 }))
      .rejects.toMatchObject({ status: 400 })
  })

  it("acepta la postulación cuando chargesVisit es true y visitCost es positivo", async () => {
    const result = await applyToPost("worker-1", { ...validInput, chargesVisit: true, visitCost: 500 })
    expect(result.status).toBe("Pending")
    expect(applicationData.createApplication).toHaveBeenCalledWith(
      "worker-1",
      expect.objectContaining({ chargesVisit: true, visitCost: 500 }),
    )
  })

  it("acepta la postulación sin visitCost cuando chargesVisit es false", async () => {
    const result = await applyToPost("worker-1", validInput)
    expect(result.status).toBe("Pending")
  })
})

describe("applyToSubcontract", () => {
  const validInput = {
    postId: "subcontract-1",
    availableDays: ["Lunes", "Martes"],
    availableTimeFrom: "09:00",
    availableTimeTo: "18:00",
    chargesVisit: false,
  }

  const mockSubcontract = {
    id: "subcontract-1",
    userId: "worker-creator",
    type: PostType.SubContract,
    title: "Busco albañil",
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
    categories: [
      { id: "cat-1", name: "Albañil", quantity: 2, filledCount: 0, roleDescription: "Albañilería general" },
    ],
    user: { id: "worker-creator", name: "Worker", surname: "Creator" },
  }

  const mockCreated = {
    id: "app-new", status: "Pending", workerId: "worker-1", postId: "subcontract-1",
    message: null, availableDays: null, availableTimeFrom: null, availableTimeTo: null,
    chargesVisit: false, visitCost: null, createdAt: new Date(), updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.mocked(postData.findPostById).mockResolvedValue(mockSubcontract)
    vi.mocked(applicationData.findApplication).mockResolvedValue(null)
    vi.mocked(applicationData.createApplication).mockResolvedValue(mockCreated)
    vi.mocked(userDatabase.findUserById).mockResolvedValue({ id: "worker-1", name: "Juan", email: "juan@test.com", phone: null, telegramChatId: null })
  })

  it("crea la postulación y retorna id, status y mensaje de éxito", async () => {
    const result = await applyToSubcontract("worker-1", validInput)
    expect(result).toEqual({ id: "app-new", status: "Pending", message: "Postulación a subcontrato exitosa" })
    expect(applicationData.createApplication).toHaveBeenCalledWith("worker-1", validInput)
  })

  it("lanza 404 si el subcontract no existe", async () => {
    vi.mocked(postData.findPostById).mockResolvedValue(null)
    await expect(applyToSubcontract("worker-1", validInput)).rejects.toMatchObject({ status: 404 })
  })

  it("lanza 400 si el post no es de tipo SubContract", async () => {
    vi.mocked(postData.findPostById).mockResolvedValue({ ...mockSubcontract, type: PostType.Post })
    await expect(applyToSubcontract("worker-1", validInput)).rejects.toMatchObject({ status: 400 })
  })

  it("lanza 400 si el subcontract no está Active", async () => {
    vi.mocked(postData.findPostById).mockResolvedValue({ ...mockSubcontract, status: "Completed" })
    await expect(applyToSubcontract("worker-1", validInput)).rejects.toMatchObject({ status: 400 })
  })

  it("lanza 400 si el worker se postula a su propio subcontract", async () => {
    await expect(applyToSubcontract("worker-creator", validInput)).rejects.toMatchObject({ status: 400 })
  })

  it("lanza 400 si no hay vacantes disponibles", async () => {
    vi.mocked(postData.findPostById).mockResolvedValue({
      ...mockSubcontract,
      categories: [
        { id: "cat-1", name: "Albañil", quantity: 2, filledCount: 2, roleDescription: "Albañilería general" },
      ],
    })
    await expect(applyToSubcontract("worker-1", validInput)).rejects.toMatchObject({ status: 400 })
  })

  it("lanza 409 si el worker ya se postuló", async () => {
    vi.mocked(applicationData.findApplication).mockResolvedValue({
      id: "existing-app", status: "Pending", workerId: "worker-1", postId: "subcontract-1",
      message: null, availableDays: null, availableTimeFrom: null, availableTimeTo: null,
      chargesVisit: false, visitCost: null, createdAt: new Date(), updatedAt: new Date(),
    })
    await expect(applyToSubcontract("worker-1", validInput)).rejects.toMatchObject({ status: 409 })
  })

  it("lanza 400 cuando chargesVisit es true y visitCost no se envía", async () => {
    await expect(applyToSubcontract("worker-1", { ...validInput, chargesVisit: true }))
      .rejects.toMatchObject({ status: 400 })
  })

  it("lanza 400 cuando chargesVisit es true y visitCost es 0", async () => {
    await expect(applyToSubcontract("worker-1", { ...validInput, chargesVisit: true, visitCost: 0 }))
      .rejects.toMatchObject({ status: 400 })
  })

  it("lanza 400 cuando chargesVisit es true y visitCost es negativo", async () => {
    await expect(applyToSubcontract("worker-1", { ...validInput, chargesVisit: true, visitCost: -100 }))
      .rejects.toMatchObject({ status: 400 })
  })

  it("acepta la postulación cuando chargesVisit es true y visitCost es positivo", async () => {
    const result = await applyToSubcontract("worker-1", { ...validInput, chargesVisit: true, visitCost: 500 })
    expect(result.status).toBe("Pending")
    expect(applicationData.createApplication).toHaveBeenCalledWith(
      "worker-1",
      expect.objectContaining({ chargesVisit: true, visitCost: 500 }),
    )
  })
})

describe("rejectApplication", () => {
  it("returns rejected application when valid", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication)
    vi.mocked(applicationData.updateApplicationStatus).mockResolvedValue({ ...mockApplication, status: "Rejected" })

    const result = await rejectApplication("client-1", "app-1")

    expect(result.status).toBe("Rejected")
    expect(applicationData.updateApplicationStatus).toHaveBeenCalledWith("app-1", "Rejected")
    expect(postData.updatePostStatus).not.toHaveBeenCalled()
  })

  it("throws 404 if application does not exist", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(null)

    await expect(rejectApplication("client-1", "app-1")).rejects.toMatchObject({ status: 404 })
  })

  it("throws 403 if requester is not the post owner", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication)

    await expect(rejectApplication("otro-cliente", "app-1")).rejects.toMatchObject({ status: 403 })
  })

  it("throws 400 if application is not Pending", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue({ ...mockApplication, status: "Accepted" })

    await expect(rejectApplication("client-1", "app-1")).rejects.toMatchObject({ status: 400 })
  })
})

describe("dismissWorker", () => {
  const acceptedApplication = {
    ...mockApplication,
    status: "Accepted",
    post: { userId: "client-1", title: "Test post", status: "In progress" },
  }

  it("dismisses the worker and reopens the post when valid", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(acceptedApplication)
    vi.mocked(applicationData.updateApplicationStatus).mockResolvedValue({ ...acceptedApplication, status: "Dismissed" })
    vi.mocked(postData.updatePostStatus).mockResolvedValue({} as never)

    const result = await dismissWorker("client-1", "app-1")

    expect(result.status).toBe("Dismissed")
    expect(applicationData.updateApplicationStatus).toHaveBeenCalledWith("app-1", "Dismissed")
    expect(postData.updatePostStatus).toHaveBeenCalledWith("post-1", "Active")
  })

  it("throws 404 if application does not exist", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(null)

    await expect(dismissWorker("client-1", "app-1")).rejects.toMatchObject({ status: 404 })
  })

  it("throws 403 if requester is not the post owner", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(acceptedApplication)

    await expect(dismissWorker("otro-cliente", "app-1")).rejects.toMatchObject({ status: 403 })
  })

  it("throws 400 if application is not Accepted", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue({
      ...acceptedApplication,
      status: "Pending",
    })

    await expect(dismissWorker("client-1", "app-1")).rejects.toMatchObject({ status: 400 })
    expect(postData.updatePostStatus).not.toHaveBeenCalled()
  })

  it("throws 400 if post is not In progress", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue({
      ...acceptedApplication,
      post: { userId: "client-1", title: "Test post", status: "Completed" },
    })

    await expect(dismissWorker("client-1", "app-1")).rejects.toMatchObject({ status: 400 })
    expect(postData.updatePostStatus).not.toHaveBeenCalled()
  })
})
