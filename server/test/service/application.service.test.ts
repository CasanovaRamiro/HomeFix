import { describe, it, expect, vi, beforeEach } from "vitest"
import * as applicationData from "../../src/infrastructure/database/application.database.js"
import * as postData from "../../src/infrastructure/database/post.database.js"
import * as userDatabase from "../../src/infrastructure/database/user.database.js"
import { acceptApplication, rejectApplication, applyToPost } from "../../src/domain/services/application.service.js"

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

  const mockPost = { id: "post-1", userId: "client-1", title: "Test post", status: "Active" }
  const mockCreated = { id: "app-new", status: "Pending" }

  beforeEach(() => {
    vi.mocked(postData.findPostById).mockResolvedValue(mockPost)
    vi.mocked(applicationData.findApplication).mockResolvedValue(null)
    vi.mocked(applicationData.createApplication).mockResolvedValue(mockCreated)
    vi.mocked(userDatabase.findUserById).mockResolvedValue({ id: "worker-1", name: "Juan" })
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
    vi.mocked(applicationData.findApplication).mockResolvedValue({ id: "existing-app" })
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
