import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPost, findPostById, findPostsByUser, updatePostStatus, updatePost as updatePostData, findAvailablePosts, findAvailableSubcontracts, searchByDistance, createSubPost } from "../../src/infrastructure/database/post.database.js";
import { findAcceptedApplication, updateApplicationStatus } from "../../src/infrastructure/database/application.database.js";
import { getWorkerRating, getClientRating, getUserRating } from "../../src/domain/services/user.service.js";
import * as postService from "../../src/domain/services/post.service.js";
import { PostType } from "../../src/domain/types/postType.js";
import type { CreatePostInput, CreateSubcontractCommand, DomainPost, DomainUserPost } from "../../src/domain/types/post.types.js";

vi.mock("../../src/infrastructure/database/post.database.js", () => ({
  createPost: vi.fn(),
  findPostsByUser: vi.fn(),
  findPostById: vi.fn(),
  updatePostStatus: vi.fn(),
  updatePost: vi.fn(),
  findAvailablePosts: vi.fn(),
  findAvailableSubcontracts: vi.fn(),
  searchByDistance: vi.fn(),
  deletePostImages: vi.fn(),
  createSubPost: vi.fn(),
}));

vi.mock("../../src/infrastructure/database/application.database.js", () => ({
  findAcceptedApplication: vi.fn(),
  updateApplicationStatus: vi.fn(),
}));

vi.mock("../../src/domain/services/user.service.js", () => ({
  getUserRating: vi.fn(),
  getWorkerRating: vi.fn(),
  getClientRating: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe("post.service - createPost", () => {
  const inputData: CreatePostInput = {
    userId: 'uuid-user-1',
    title: "Tubo roto en cocina",
    description: "El tubo bajo el lavaplatos está roto",
    startDate: new Date("2026-06-01T00:00:00.000Z"),
    endDate: new Date("2026-06-15T00:00:00.000Z"),
    address: "Calle Principal 123, Apt 4B",
    categoryId: 'uuid-category-1',
  };
  const createdPostMock: DomainPost = {
    id: 'uuid-post-1',
    userId: 'uuid-user-1',
    title: "Tubo roto en cocina",
    description: "El tubo bajo el lavaplatos está roto",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-15"),
    address: "Calle Principal 123, Apt 4B",
    status: "Active",
    images: [],
    latitude: null,
    longitude: null,
    createdAt: new Date(),
    categories: [],
    user: { id: 'uuid-user-1', name: 'Test', surname: 'User' },
  };

  it("should create a post successfully", async () => {
    vi.mocked(createPost).mockResolvedValue(createdPostMock);

    const result = await postService.createPost(inputData);

    expect(createPost).toHaveBeenCalledTimes(1);

    expect(createPost).toHaveBeenCalledWith({ ...inputData, emergencyExpiresAt: null });

    expect(result).toEqual(createdPostMock);
  });
});

describe("post.service - getPostById", () => {
  const postDetailMock: DomainPost = {
    id: 'uuid-post-1',
    userId: 'uuid-user-1',
    title: "Tubo roto en cocina",
    description: "Descripcion detallada",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-15"),
    address: "Calle Principal 123",
    status: "Active",
    createdAt: new Date("2026-05-25"),
    images: [],
    latitude: null,
    longitude: null,
    categories: [{ id: 'uuid-category-1', name: "Plomeria" }],
    user: { id: 'uuid-user-1', name: "Test User", surname: "Test" },
  };

  it("should return a post by id", async () => {
    vi.mocked(findPostById).mockResolvedValue(postDetailMock);
    vi.mocked(getUserRating).mockResolvedValue({ averageRating: 4.5, reviewCount: 10 });

    const result = await postService.getPostById('uuid-post-1');

    expect(findPostById).toHaveBeenCalledWith('uuid-post-1');
    expect(result).toBeDefined();
    expect(result!.id).toBe('uuid-post-1');
    expect(result!.title).toBe('Tubo roto en cocina');
    expect(result!.clientRating).toBe(4.5);
  });

  it("should return null when post does not exist", async () => {
    vi.mocked(findPostById).mockResolvedValue(null);

    const result = await postService.getPostById('non-existent-id');

    expect(findPostById).toHaveBeenCalledWith('non-existent-id');
    expect(result).toBeNull();
  });
});

describe("post.service - getUserPosts", () => {
  const userPostsMock: DomainUserPost[] = [
    {
      id: 'uuid-post-1',
      title: "Test Post",
      description: "Test description",
      status: "Active",
      createdAt: new Date("2026-05-01"),
      address: "123 Test St",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-15"),
      categories: [{ id: 'uuid-category-1', name: "Plumbing" }],
      worker: null,
      applicantCount: 0,
      hasReview: false,
    },
  ];

  it("should return posts for a valid userId", async () => {
    vi.mocked(findPostsByUser).mockResolvedValue(userPostsMock);

    const result = await postService.getUserPosts('uuid-user-1');

    expect(findPostsByUser).toHaveBeenCalledWith('uuid-user-1');
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].title).toBe('Test Post');
  });

  it("should return empty array when no posts found", async () => {
    vi.mocked(findPostsByUser).mockResolvedValue([]);

    const result = await postService.getUserPosts('uuid-user-1');
    expect(result).toEqual([]);
  });
});

describe("post.service - listAvailablePosts", () => {
  const mockPost: DomainPost = {
    id: "uuid-1",
    userId: "uuid-user-1",
    title: "Reparación de caño",
    description: "Test",
    address: "Calle 123",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-15"),
    status: "Active",
    createdAt: new Date("2026-05-25"),
    images: [],
    latitude: null,
    longitude: null,
    categories: [{ id: "uuid-cat-1", name: "Plomero" }],
    user: { id: "uuid-user-1", name: "Test", surname: "User" },
  };

  beforeEach(() => {
    vi.mocked(getUserRating).mockResolvedValue({ averageRating: 4.5, reviewCount: 10 })
  })

  it("should return available posts without category filter", async () => {
    vi.mocked(findAvailablePosts).mockResolvedValue({ posts: [mockPost], total: 1 });

    const result = await postService.listAvailablePosts();

    expect(findAvailablePosts).toHaveBeenCalledWith(undefined, undefined);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].categories).toEqual([{ id: "uuid-cat-1", name: "Plomero" }]);
    expect(result.data[0].clientRating).toBe(4.5);
    expect(result.total).toBe(1);
  });

  it("should filter available posts by category", async () => {
    vi.mocked(findAvailablePosts).mockResolvedValue({ posts: [mockPost], total: 1 });

    const result = await postService.listAvailablePosts("Plomero");

    expect(findAvailablePosts).toHaveBeenCalledWith("Plomero", undefined);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].clientRating).toBe(4.5);
  });

  it("should return empty array when no posts match", async () => {
    vi.mocked(findAvailablePosts).mockResolvedValue({ posts: [], total: 0 });

    const result = await postService.listAvailablePosts("NonExistent");

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe("post.service - findAvailableSubcontracts", () => {
  const mockSubcontract: DomainPost = {
    id: "uuid-sub-1",
    userId: "uuid-user-1",
    title: "Electricista needed",
    description: "Subcontract for electrical work",
    address: "Calle 123",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-15"),
    status: "Active",
    createdAt: new Date("2026-05-25"),
    images: [],
    latitude: null,
    longitude: null,
    categories: [{ id: "uuid-cat-1", name: "Electricista" }],
    user: { id: "uuid-user-1", name: "Test", surname: "User" },
  };

  beforeEach(() => {
    vi.mocked(getUserRating).mockResolvedValue({ averageRating: 4.5, reviewCount: 10 });
  });

  it("should return available subcontracts with client rating", async () => {
    vi.mocked(findAvailableSubcontracts).mockResolvedValue([mockSubcontract]);

    const result = await postService.findAvailableSubcontracts();

    expect(findAvailableSubcontracts).toHaveBeenCalledOnce();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Electricista needed");
    expect(result[0].clientRating).toBe(4.5);
  });

  it("should return empty array when no subcontracts are available", async () => {
    vi.mocked(findAvailableSubcontracts).mockResolvedValue([]);

    const result = await postService.findAvailableSubcontracts();

    expect(result).toEqual([]);
  });
});

describe("post.service - getSubcontractById", () => {
  const subcontractMock: DomainPost = {
    id: "uuid-sub-1",
    userId: "mmo-user-id",
    type: PostType.SubContract,
    parentPostId: "parent-post-id",
    title: "Electricista needed",
    description: "Subcontract for electrical work",
    address: "Calle 123",
    startDate: new Date("2026-06-01"),
    endDate: new Date("2026-06-15"),
    status: "Active",
    createdAt: new Date("2026-05-25"),
    images: [],
    latitude: null,
    longitude: null,
    categories: [{ id: "uuid-cat-1", name: "Electricista" }],
    user: { id: "mmo-user-id", name: "MMO", surname: "Test" },
  }

  const parentPostMock: DomainPost = {
    id: "parent-post-id",
    userId: "client-user-id",
    type: PostType.Post,
    title: "Arreglo de cocina",
    description: "Arreglar cocina completa",
    address: "Calle 123",
    startDate: new Date("2026-07-01"),
    endDate: new Date("2026-07-15"),
    status: "Active",
    createdAt: new Date(),
    images: [],
    latitude: null,
    longitude: null,
    categories: [],
    user: { id: "client-user-id", name: "Client", surname: "Test" },
  }

  it("should return subcontract with workerRating, original clientRating and parentUser", async () => {
    vi.mocked(findPostById).mockResolvedValueOnce(subcontractMock)
    vi.mocked(findPostById).mockResolvedValueOnce(parentPostMock)
    vi.mocked(getWorkerRating).mockResolvedValue({ averageRating: 4.2, reviewCount: 5 })
    vi.mocked(getClientRating).mockResolvedValue({ averageRating: 3.8, reviewCount: 2 })

    const result = await postService.getSubcontractById("uuid-sub-1")

    expect(findPostById).toHaveBeenNthCalledWith(1, "uuid-sub-1")
    expect(findPostById).toHaveBeenNthCalledWith(2, "parent-post-id")
    expect(getWorkerRating).toHaveBeenCalledWith("mmo-user-id")
    expect(getClientRating).toHaveBeenCalledWith("client-user-id")
    expect(result).not.toBeNull()
    expect(result!.type).toBe(PostType.SubContract)
    expect(result!.workerRating).toBe(4.2)
    expect(result!.clientRating).toBe(3.8)
    expect(result!.parentUser).toEqual({ name: "Client", surname: "Test" })
  })

  it("should return null for regular post (type: post)", async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...subcontractMock, type: PostType.Post })

    const result = await postService.getSubcontractById("uuid-sub-1")

    expect(result).toBeNull()
  })

  it("should return null when post does not exist", async () => {
    vi.mocked(findPostById).mockResolvedValue(null)

    const result = await postService.getSubcontractById("non-existent-id")

    expect(result).toBeNull()
  })

  it("should return subcontract without parentPostId (no originalClientRating)", async () => {
    const noParentSub = { ...subcontractMock, parentPostId: undefined }
    vi.mocked(findPostById).mockResolvedValue(noParentSub)
    vi.mocked(getWorkerRating).mockResolvedValue({ averageRating: 4.0, reviewCount: 3 })

    const result = await postService.getSubcontractById("uuid-sub-1")

    expect(result).not.toBeNull()
    expect(result!.workerRating).toBe(4.0)
    expect(result!.clientRating).toBeUndefined()
  })
})

describe("post.service - searchPostsByDistance", () => {
  it("should call searchByDistance with correct params", async () => {
    vi.mocked(searchByDistance).mockResolvedValue([]);

    const result = await postService.searchPostsByDistance(-34.6, -58.4, 10);

    expect(searchByDistance).toHaveBeenCalledWith(-34.6, -58.4, 10, undefined);
    expect(result).toEqual([]);
  });

  it("should reject invalid latitude", async () => {
    await expect(postService.searchPostsByDistance(200, 0, 10)).rejects.toThrow("latitude must be between -90 and 90");
  });

  it("should reject invalid longitude", async () => {
    await expect(postService.searchPostsByDistance(0, 200, 10)).rejects.toThrow("longitude must be between -180 and 180");
  });

  it("should reject radius larger than 1000", async () => {
    await expect(postService.searchPostsByDistance(0, 0, 2000)).rejects.toThrow("radius must be between 1 and 1000 km");
  });

  it("should reject non-finite numbers", async () => {
    await expect(postService.searchPostsByDistance(NaN, 0, 10)).rejects.toThrow("lat, lng, and radius must be finite numbers");
  });
});

describe('post.service - pausePost', () => {
  const activePost: DomainPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'Reparación de caño',
    description: 'Test',
    address: 'Calle 123',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-15'),
    status: 'Active',
    createdAt: new Date("2026-05-25"),
    images: [],
    latitude: null,
    longitude: null,
    categories: [{ id: 'uuid-category-1', name: "Plomeria" }],
    user: { id: 'user-uuid-1', name: 'Test', surname: 'User' },
  }

  it('pausa un post activo', async () => {
    vi.mocked(findPostById).mockResolvedValue(activePost)
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Paused', updatedAt: new Date() } as never)

    const result = await postService.pausePost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Paused')
    expect(result.status).toBe('Paused')
  })

  it('activa un post pausado', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Paused' })
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Active', updatedAt: new Date() } as never)

    const result = await postService.pausePost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Active')
    expect(result.status).toBe('Active')
  })

  it('lanza 404 si el post no existe', async () => {
    vi.mocked(findPostById).mockResolvedValue(null)

    await expect(postService.pausePost('no-existe', 'user-uuid-1')).rejects.toMatchObject({ status: 404 })
  })

  it('lanza 403 si el post pertenece a otro usuario', async () => {
    vi.mocked(findPostById).mockResolvedValue(activePost)

    await expect(postService.pausePost('uuid-1', 'otro-usuario')).rejects.toMatchObject({ status: 403 })
  })

  it('lanza 400 si el post está en estado In progress', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'In progress' })

    await expect(postService.pausePost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })

  it('lanza 400 si el post está en estado Completed', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Completed' })

    await expect(postService.pausePost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })

  it('lanza 400 si el post está en estado Cancelled', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Cancelled' })

    await expect(postService.pausePost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })
})

describe('post.service - cancelPost', () => {
  const activePost: DomainPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'Reparación de caño',
    description: 'Test',
    address: 'Calle 123',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-15'),
    status: 'Active',
    createdAt: new Date("2026-05-25"),
    images: [],
    latitude: null,
    longitude: null,
    categories: [{ id: 'uuid-category-1', name: "Plomeria" }],
    user: { id: 'user-uuid-1', name: 'Test', surname: 'User' },
  }

  it('cancela un post activo', async () => {
    vi.mocked(findPostById).mockResolvedValue(activePost)
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Cancelled', updatedAt: new Date() } as never)

    const result = await postService.cancelPost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Cancelled')
    expect(result.status).toBe('Cancelled')
  })

  it('cancela un post pausado', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Paused' })
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Cancelled', updatedAt: new Date() } as never)

    const result = await postService.cancelPost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Cancelled')
    expect(result.status).toBe('Cancelled')
  })

  it('cancela un post en In progress', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'In progress' })
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Cancelled', updatedAt: new Date() } as never)

    const result = await postService.cancelPost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Cancelled')
    expect(result.status).toBe('Cancelled')
  })

  it('lanza 404 si el post no existe', async () => {
    vi.mocked(findPostById).mockResolvedValue(null)

    await expect(postService.cancelPost('no-existe', 'user-uuid-1')).rejects.toMatchObject({ status: 404 })
  })

  it('lanza 403 si el post pertenece a otro usuario', async () => {
    vi.mocked(findPostById).mockResolvedValue(activePost)

    await expect(postService.cancelPost('uuid-1', 'otro-usuario')).rejects.toMatchObject({ status: 403 })
  })

  it('lanza 400 si el post está en estado Completed', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Completed' })

    await expect(postService.cancelPost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })

  it('lanza 400 si el post está en estado Cancelled', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Cancelled' })

    await expect(postService.cancelPost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })
})

describe('post.service - finalizePost', () => {
  const mockPost: DomainPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'Reparación de caño',
    description: 'Test',
    address: 'Calle 123',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-15'),
    status: 'Paused',
    createdAt: new Date("2026-05-25"),
    images: [],
    latitude: null,
    longitude: null,
    categories: [{ id: 'uuid-category-1', name: "Plomeria" }],
    user: { id: 'user-uuid-1', name: 'Test', surname: 'User' },
  }

  it('finaliza el post cuando está pausado y pertenece al usuario', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)

    vi.mocked(updatePostStatus).mockResolvedValue({ ...mockPost, status: 'Completed', updatedAt: new Date() } as never)

    const result = await postService.finalizePost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Completed')
    expect(result.status).toBe('Completed')
  })

  it('lanza 404 si el post no existe', async () => {
    vi.mocked(findPostById).mockResolvedValue(null)

    await expect(postService.finalizePost('no-existe', 'user-uuid-1')).rejects.toMatchObject({ status: 404 })
  })

  it('lanza 403 si el post pertenece a otro usuario', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)

    await expect(postService.finalizePost('uuid-1', 'otro-usuario')).rejects.toMatchObject({ status: 403 })
  })

  it('lanza 400 si el post no está en estado Paused', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...mockPost, status: 'Active' })

    await expect(postService.finalizePost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })
})

describe('post.service - completePost', () => {
  const mockPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    status: 'In progress',
  }

  it('completa el post cuando está In progress', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost as never)
    vi.mocked(updatePostStatus).mockResolvedValue({ id: 'uuid-1', status: 'Completed' } as never)

    await postService.completePost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Completed')
  })

  it('lanza 404 si el post no existe', async () => {
    vi.mocked(findPostById).mockResolvedValue(null)
    await expect(postService.completePost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 404 })
  })

  it('lanza 403 si el post pertenece a otro usuario', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost as never)
    await expect(postService.completePost('uuid-1', 'otro-usuario')).rejects.toMatchObject({ status: 403 })
  })

  it('lanza 400 si el post no está In progress', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...mockPost, status: 'Active' } as never)
    await expect(postService.completePost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })
})

describe('post.service - reopenPost', () => {
  const mockInProgress = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    status: 'In progress',
  }

  it('reabre el post y resetea la aplicación aceptada a Pending', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockInProgress as never)
    vi.mocked(findAcceptedApplication).mockResolvedValue({
      id: 'app-1',
      status: 'Accepted',
      createdAt: new Date(),
      updatedAt: new Date(),
      workerId: 'worker-uuid',
      postId: 'uuid-1',
      message: null,
      availableDays: null,
      availableTimeFrom: null,
      availableTimeTo: null,
      chargesVisit: false,
      visitCost: null,
    })
    vi.mocked(updateApplicationStatus).mockResolvedValue({
      id: 'app-1',
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      workerId: 'worker-uuid',
      postId: 'uuid-1',
      message: null,
      availableDays: null,
      availableTimeFrom: null,
      availableTimeTo: null,
      chargesVisit: false,
      visitCost: null,
    })
    vi.mocked(updatePostStatus).mockResolvedValue({ id: 'uuid-1', status: 'Active' } as never)

    await postService.reopenPost('uuid-1', 'user-uuid-1')

    expect(updateApplicationStatus).toHaveBeenCalledWith('app-1', 'Pending')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Active')
  })

  it('funciona aunque no haya aplicación aceptada', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockInProgress as never)
    vi.mocked(findAcceptedApplication).mockResolvedValue(null)
    vi.mocked(updatePostStatus).mockResolvedValue({ id: 'uuid-1', status: 'Active' } as never)

    await postService.reopenPost('uuid-1', 'user-uuid-1')

    expect(updateApplicationStatus).not.toHaveBeenCalled()
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Active')
  })

  it('lanza 404 si el post no existe', async () => {
    vi.mocked(findPostById).mockResolvedValue(null)
    await expect(postService.reopenPost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 404 })
  })

  it('lanza 403 si el post pertenece a otro usuario', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockInProgress as never)
    await expect(postService.reopenPost('uuid-1', 'otro-usuario')).rejects.toMatchObject({ status: 403 })
  })

  it('lanza 400 si el post no está In progress', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...mockInProgress, status: 'Active' } as never)
    await expect(postService.reopenPost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })
})

describe('post.service - updatePost', () => {
  const activePost: DomainPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'Reparación de caño',
    description: 'Test',
    address: 'Calle 123',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-15'),
    status: 'Active',
    createdAt: new Date("2026-05-25"),
    images: [],
    latitude: null,
    longitude: null,
    categories: [{ id: 'uuid-category-1', name: "Plomeria" }],
    user: { id: 'user-uuid-1', name: 'Test', surname: 'User' },
  }

  const updateInput = {
    title: 'Título editado',
    description: 'Descripción editada',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-20'),
    address: 'Nueva dirección 456',
    categoryId: 'uuid-category-1',
  }

  it('edita un post activo', async () => {
    vi.mocked(findPostById).mockResolvedValue(activePost)
    vi.mocked(updatePostData).mockResolvedValue({ ...activePost, title: 'Título editado' })

    const result = await postService.updatePost('uuid-1', 'user-uuid-1', updateInput)

    expect(updatePostData).toHaveBeenCalledWith('uuid-1', { userId: 'user-uuid-1', ...updateInput, emergencyExpiresAt: null })
    expect(result.title).toBe('Título editado')
  })

  it('edita un post pausado', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Paused' })
    vi.mocked(updatePostData).mockResolvedValue({ ...activePost, status: 'Paused', title: 'Título editado' })

    const result = await postService.updatePost('uuid-1', 'user-uuid-1', updateInput)

    expect(result.title).toBe('Título editado')
  })

  it('lanza 404 si el post no existe', async () => {
    vi.mocked(findPostById).mockResolvedValue(null)
    await expect(postService.updatePost('no-existe', 'user-uuid-1', updateInput)).rejects.toMatchObject({ status: 404 })
  })

  it('lanza 403 si no es el owner', async () => {
    vi.mocked(findPostById).mockResolvedValue(activePost)
    await expect(postService.updatePost('uuid-1', 'otro-usuario', updateInput)).rejects.toMatchObject({ status: 403 })
  })

  for (const status of ['In progress', 'Completed', 'Cancelled']) {
    it(`lanza 400 si el post está ${status}`, async () => {
      vi.mocked(findPostById).mockResolvedValue({ ...activePost, status })
      await expect(postService.updatePost('uuid-1', 'user-uuid-1', updateInput)).rejects.toMatchObject({ status: 400 })
    })
  }

  it('lanza error si el título está vacío', async () => {
    vi.mocked(findPostById).mockResolvedValue(activePost)
    await expect(postService.updatePost('uuid-1', 'user-uuid-1', { ...updateInput, title: '' })).rejects.toThrow('title is required')
  })

  it('lanza error si endDate <= startDate', async () => {
    vi.mocked(findPostById).mockResolvedValue(activePost)
    await expect(postService.updatePost('uuid-1', 'user-uuid-1', { ...updateInput, endDate: new Date('2026-05-01') })).rejects.toThrow('endDate must be after startDate')
  })
})

describe('post.service - createSubContract', () => {
  const validInput: CreateSubcontractCommand = {
    userId: 'mmo-user-id',
    parentPostId: 'parent-post-id',
    positions: [
      { categoryId: 'cat-1', quantity: 2, roleDescription: 'Albañilería general' },
      { categoryId: 'cat-2', quantity: 1, roleDescription: 'Instalación eléctrica' },
    ],
  }

  const parentPostMock: DomainPost = {
    id: 'parent-post-id',
    userId: 'client-user-id',
    title: 'Arreglo de cocina',
    description: 'Arreglar cocina completa',
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-07-15'),
    address: 'Calle 123',
    status: 'Active',
    createdAt: new Date(),
    images: [],
    latitude: null,
    longitude: null,
    categories: [],
    user: { id: 'client-user-id', name: 'Client', surname: 'Test' },
  }

  const createdSubPostMock: DomainPost = {
    id: 'new-sub-post-id',
    userId: 'mmo-user-id',
    title: 'Subcontratación: Arreglo de cocina',
    description: 'Se necesita: 2 Albañilería general, 1 Instalación eléctrica',
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-07-15'),
    address: 'Calle 123',
    status: 'Active',
    createdAt: new Date(),
    images: [],
    latitude: null,
    longitude: null,
    categories: [],
    user: { id: 'mmo-user-id', name: 'MMO', surname: 'Test' },
  }

  it('creates a subcontract with parentPostId', async () => {
    vi.mocked(findPostById).mockResolvedValue(parentPostMock)
    vi.mocked(findAcceptedApplication).mockResolvedValue({
      id: 'app-1',
      workerId: 'mmo-user-id',
      postId: 'parent-post-id',
      status: 'Accepted',
    } as never)
    vi.mocked(createSubPost).mockResolvedValue(createdSubPostMock)

    const result = await postService.createSubContract(validInput)

    expect(findPostById).toHaveBeenCalledWith('parent-post-id')
    expect(findAcceptedApplication).toHaveBeenCalledWith('parent-post-id')
    expect(createSubPost).toHaveBeenCalled()
    expect(result.title).toBe('Subcontratación: Arreglo de cocina')
  })

  it('throws 404 when parentPost does not exist', async () => {
    vi.mocked(findPostById).mockResolvedValue(null)

    await expect(postService.createSubContract(validInput)).rejects.toMatchObject({ status: 404 })
  })

  it('throws 403 when user is not the accepted MMO on parentPost', async () => {
    vi.mocked(findPostById).mockResolvedValue(parentPostMock)
    vi.mocked(findAcceptedApplication).mockResolvedValue(null)

    await expect(postService.createSubContract(validInput)).rejects.toMatchObject({ status: 403 })
  })

  it('creates a subcontract without parentPostId', async () => {
    const noParentInput: CreateSubcontractCommand = {
      userId: 'mmo-user-id',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-15'),
      address: 'Otra calle 456',
      positions: [{ categoryId: 'cat-1', quantity: 1, roleDescription: 'Pintura' }],
    }
    vi.mocked(createSubPost).mockResolvedValue({
      ...createdSubPostMock,
      parentPostId: undefined,
      title: 'Subcontratación',
    } as never)

    const result = await postService.createSubContract(noParentInput)

    expect(createSubPost).toHaveBeenCalled()
    expect(result.parentPostId).toBeUndefined()
  })
})
