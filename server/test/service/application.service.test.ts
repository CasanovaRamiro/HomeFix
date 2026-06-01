import { describe, it, expect, vi, beforeEach } from "vitest"
import * as applicationData from "../../src/data/application.data.js"
import * as postData from "../../src/data/post.data.js"
import { acceptApplication } from "../../src/services/application.service.js"

vi.mock("../../src/data/application.data.js", () => ({
  findApplicationsByWorker: vi.fn(),
  findApplication: vi.fn(),
  createApplication: vi.fn(),
  findApplicationById: vi.fn(),
  updateApplicationStatus: vi.fn(),
  rejectOtherApplications: vi.fn(),
}))

vi.mock("../../src/data/post.data.js", () => ({
  findPostById: vi.fn(),
  updatePostStatus: vi.fn(),
  createPost: vi.fn(),
  findPostsByUser: vi.fn(),
  findAvailablePosts: vi.fn(),
  searchByDistance: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())

const mockApplication = {
  id: "app-1",
  workerId: "worker-1",
  postId: "post-1",
  status: "Pending",
  createdAt: new Date(),
  updatedAt: new Date(),
  post: { userId: "client-1", status: "Active" },
}

describe("acceptApplication", () => {
  it("returns accepted application when valid", async () => {
    vi.mocked(applicationData.findApplicationById).mockResolvedValue(mockApplication)
    vi.mocked(applicationData.updateApplicationStatus).mockResolvedValue({ ...mockApplication, status: "Accepted" })
    vi.mocked(postData.updatePostStatus).mockResolvedValue({} as never)
    vi.mocked(applicationData.rejectOtherApplications).mockResolvedValue({ count: 0 })

    const result = await acceptApplication("client-1", "app-1")

    expect(result.status).toBe("Accepted")
    expect(applicationData.updateApplicationStatus).toHaveBeenCalledWith("app-1", "Accepted")
    expect(postData.updatePostStatus).toHaveBeenCalledWith("post-1", "In progress")
    expect(applicationData.rejectOtherApplications).toHaveBeenCalledWith("post-1", "app-1")
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
      post: { userId: "client-1", status: "In progress" },
    })

    await expect(acceptApplication("client-1", "app-1")).rejects.toMatchObject({ status: 400 })
  })
})
