import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPost, findPostById, findPostsByUser, updatePostStatus, updatePost as updatePostData, findAvailablePosts, findAvailableSubcontracts, findEmergencyPosts, searchByDistance, createSubPost, findPostsByGroupId, findPostCategories } from "../../src/infrastructure/database/post.database.js";
import { broadcastEmergency, notifyUser } from "../../src/domain/services/notification.service.js";
import { findAcceptedApplication, findAcceptedApplications, updateApplicationStatus, rejectPendingApplications } from "../../src/infrastructure/database/application.database.js";
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
  findEmergencyPosts: vi.fn(),
  searchByDistance: vi.fn(),
  deletePostImages: vi.fn().mockResolvedValue(undefined),
  createSubPost: vi.fn(),
  findPostsByGroupId: vi.fn(),
  findPostCategories: vi.fn(),
}));

vi.mock("../../src/infrastructure/database/application.database.js", () => ({
  findAcceptedApplication: vi.fn(),
  findAcceptedApplications: vi.fn(),
  updateApplicationStatus: vi.fn(),
  rejectPendingApplications: vi.fn(),
}));

vi.mock("../../src/domain/services/user.service.js", () => ({
  getUserRating: vi.fn(),
  getWorkerRating: vi.fn(),
  getClientRating: vi.fn(),
}));

vi.mock("../../src/domain/services/notification.service.js", () => ({
  notifyUser: vi.fn(),
  broadcastEmergency: vi.fn(),
}));

vi.mock("../../src/infrastructure/providers/telegram.provider.js", () => ({
  createTelegramProvider: vi.fn(() => ({ name: 'telegram', send: vi.fn() })),
}));

vi.mock("../../src/infrastructure/providers/cloudinary.provider.js", () => ({
  deleteImage: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe("post.service - createPost", () => {
  const inputData: CreatePostInput = {
    userId: 'uuid-user-1',
    title: "Tubo roto en cocina",
    description: "El tubo bajo el lavaplatos estÃ¡ roto",
    startDate: new Date("2026-06-01T00:00:00.000Z"),
    endDate: new Date("2026-06-15T00:00:00.000Z"),
    address: "Calle Principal 123, Apt 4B",
    categoryId: 'uuid-category-1',
  };
  const createdPostMock: DomainPost = {
    id: 'uuid-post-1',
    userId: 'uuid-user-1',
    title: "Tubo roto en cocina",
    description: "El tubo bajo el lavaplatos estÃ¡ roto",
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
    title: "ReparaciÃ³n de caÃ±o",
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
    title: 'ReparaciÃ³n de caÃ±o',
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

  it('lanza 400 si el post estÃ¡ en estado In progress', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'In progress' })

    await expect(postService.pausePost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })

  it('lanza 400 si el post estÃ¡ en estado Completed', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Completed' })

    await expect(postService.pausePost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })

  it('lanza 400 si el post estÃ¡ en estado Cancelled', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Cancelled' })

    await expect(postService.pausePost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })

  it('pausa todos los posts Active de un grupo SubContract', async () => {
    const subcontractPost: DomainPost = {
      ...activePost,
      type: PostType.SubContract,
      subcontractGroupId: 'group-1',
    }
    const groupPosts = [
      { ...subcontractPost, id: 'uuid-1' },
      { ...subcontractPost, id: 'uuid-2' },
    ]
    vi.mocked(findPostById).mockResolvedValue(subcontractPost)
    vi.mocked(findPostsByGroupId).mockResolvedValue(groupPosts)

    await postService.pausePost('uuid-1', 'user-uuid-1')

    expect(findPostsByGroupId).toHaveBeenCalledWith('group-1')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Paused')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-2', 'Paused')
    expect(updatePostStatus).toHaveBeenCalledTimes(2)
  })

  it('activa todos los posts Paused de un grupo SubContract', async () => {
    const subcontractPost: DomainPost = {
      ...activePost,
      status: 'Paused',
      type: PostType.SubContract,
      subcontractGroupId: 'group-1',
    }
    const groupPosts = [
      { ...subcontractPost, id: 'uuid-1' },
      { ...subcontractPost, id: 'uuid-2' },
    ]
    vi.mocked(findPostById).mockResolvedValue(subcontractPost)
    vi.mocked(findPostsByGroupId).mockResolvedValue(groupPosts)

    await postService.pausePost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Active')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-2', 'Active')
    expect(updatePostStatus).toHaveBeenCalledTimes(2)
  })

  it('salta posts con estado no toggleable en grupo SubContract', async () => {
    const subcontractPost: DomainPost = {
      ...activePost,
      type: PostType.SubContract,
      subcontractGroupId: 'group-1',
    }
    const groupPosts = [
      { ...subcontractPost, id: 'uuid-1' },
      { ...subcontractPost, id: 'uuid-2', status: 'Completed' },
      { ...subcontractPost, id: 'uuid-3', status: 'Cancelled' },
    ]
    vi.mocked(findPostById).mockResolvedValue(subcontractPost)
    vi.mocked(findPostsByGroupId).mockResolvedValue(groupPosts)

    await postService.pausePost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledTimes(1)
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Paused')
  })
})

describe('post.service - cancelPost', () => {
  const activePost: DomainPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'ReparaciÃ³n de caÃ±o',
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
    vi.mocked(findAcceptedApplications).mockResolvedValue([])
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Cancelled', updatedAt: new Date() } as never)

    const result = await postService.cancelPost('uuid-1', 'user-uuid-1')

    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-1')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Cancelled')
    expect(result.status).toBe('Cancelled')
  })

  it('cancela un post pausado', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Paused' })
    vi.mocked(findAcceptedApplications).mockResolvedValue([])
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Cancelled', updatedAt: new Date() } as never)

    const result = await postService.cancelPost('uuid-1', 'user-uuid-1')

    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-1')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Cancelled')
    expect(result.status).toBe('Cancelled')
  })

  it('cancela un post en In progress', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'In progress' })
    vi.mocked(findAcceptedApplications).mockResolvedValue([])
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Cancelled', updatedAt: new Date() } as never)

    const result = await postService.cancelPost('uuid-1', 'user-uuid-1')

    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-1')
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

  it('lanza 400 si el post estÃ¡ en estado Completed', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Completed' })

    await expect(postService.cancelPost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })

  it('lanza 400 si el post estÃ¡ en estado Cancelled', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Cancelled' })

    await expect(postService.cancelPost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })

  it('cancela todos los posts de un grupo SubContract', async () => {
    const subcontractPost: DomainPost = {
      ...activePost,
      type: PostType.SubContract,
      subcontractGroupId: 'group-1',
    }
    const groupPosts = [
      { ...subcontractPost, id: 'uuid-1' },
      { ...subcontractPost, id: 'uuid-2', status: 'Paused' },
      { ...subcontractPost, id: 'uuid-3', status: 'In progress' },
    ]
    vi.mocked(findPostById).mockResolvedValue(subcontractPost)
    vi.mocked(findPostsByGroupId).mockResolvedValue(groupPosts)
    vi.mocked(findAcceptedApplications).mockResolvedValue([])

    await postService.cancelPost('uuid-1', 'user-uuid-1')

    expect(findPostsByGroupId).toHaveBeenCalledWith('group-1')
    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-1')
    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-2')
    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-3')
    expect(rejectPendingApplications).toHaveBeenCalledTimes(3)
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Cancelled')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-2', 'Cancelled')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-3', 'Cancelled')
    expect(updatePostStatus).toHaveBeenCalledTimes(3)
  })

  it('salta posts Completed y Cancelled en grupo SubContract', async () => {
    const subcontractPost: DomainPost = {
      ...activePost,
      type: PostType.SubContract,
      subcontractGroupId: 'group-1',
    }
    const groupPosts = [
      { ...subcontractPost, id: 'uuid-1' },
      { ...subcontractPost, id: 'uuid-2', status: 'Completed' },
      { ...subcontractPost, id: 'uuid-3', status: 'Cancelled' },
    ]
    vi.mocked(findPostById).mockResolvedValue(subcontractPost)
    vi.mocked(findPostsByGroupId).mockResolvedValue(groupPosts)
    vi.mocked(findAcceptedApplications).mockResolvedValue([])

    await postService.cancelPost('uuid-1', 'user-uuid-1')

    expect(rejectPendingApplications).toHaveBeenCalledTimes(1)
    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-1')
    expect(rejectPendingApplications).not.toHaveBeenCalledWith('uuid-2')
    expect(rejectPendingApplications).not.toHaveBeenCalledWith('uuid-3')
    expect(updatePostStatus).toHaveBeenCalledTimes(1)
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Cancelled')
    expect(updatePostStatus).not.toHaveBeenCalledWith('uuid-2', 'Cancelled')
    expect(updatePostStatus).not.toHaveBeenCalledWith('uuid-3', 'Cancelled')
  })
})

describe('post.service - finalizePost', () => {
  const mockPost: DomainPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'ReparaciÃ³n de caÃ±o',
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

  it('finaliza el post cuando estÃ¡ pausado y pertenece al usuario', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)

    vi.mocked(updatePostStatus).mockResolvedValue({ ...mockPost, status: 'Completed', updatedAt: new Date() } as never)

    const result = await postService.finalizePost('uuid-1', 'user-uuid-1')

    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-1')
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

  it('lanza 400 si el post no está en estado Paused o Active', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...mockPost, status: 'In progress' })

    await expect(postService.finalizePost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })

  it('finaliza todos los posts Paused de un grupo SubContract', async () => {
    const subcontractPost: DomainPost = {
      ...mockPost,
      type: PostType.SubContract,
      subcontractGroupId: 'group-1',
    }
    const groupPosts = [
      { ...subcontractPost, id: 'uuid-1' },
      { ...subcontractPost, id: 'uuid-2' },
    ]
    vi.mocked(findPostById).mockResolvedValue(subcontractPost)
    vi.mocked(findPostsByGroupId).mockResolvedValue(groupPosts)
    vi.mocked(findAcceptedApplications).mockResolvedValue([])

    await postService.finalizePost('uuid-1', 'user-uuid-1')

    expect(findPostsByGroupId).toHaveBeenCalledWith('group-1')
    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-1')
    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-2')
    expect(rejectPendingApplications).toHaveBeenCalledTimes(2)
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Completed')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-2', 'Completed')
    expect(updatePostStatus).toHaveBeenCalledTimes(2)
  })

  it('procesa todos los posts no Completed/Cancelled en grupo SubContract al finalizar', async () => {
    const subcontractPost: DomainPost = {
      ...mockPost,
      type: PostType.SubContract,
      subcontractGroupId: 'group-1',
    }
    const groupPosts = [
      { ...subcontractPost, id: 'uuid-1' },
      { ...subcontractPost, id: 'uuid-2', status: 'Active' },
      { ...subcontractPost, id: 'uuid-3', status: 'Completed' },
    ]
    vi.mocked(findPostById).mockResolvedValue(subcontractPost)
    vi.mocked(findPostsByGroupId).mockResolvedValue(groupPosts)
    vi.mocked(findAcceptedApplications).mockResolvedValue([])

    await postService.finalizePost('uuid-1', 'user-uuid-1')

    expect(rejectPendingApplications).toHaveBeenCalledTimes(2)
    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-1')
    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-2')
    expect(rejectPendingApplications).not.toHaveBeenCalledWith('uuid-3')
    expect(updatePostStatus).toHaveBeenCalledTimes(2)
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Completed')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-2', 'Completed')
  })
})

describe('post.service - completePost', () => {
  const mockPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    status: 'In progress',
  }

  it('completa el post cuando estÃ¡ In progress', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost as never)
    vi.mocked(updatePostStatus).mockResolvedValue({ id: 'uuid-1', status: 'Completed' } as never)

    await postService.completePost('uuid-1', 'user-uuid-1')

    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-1')
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

  it('lanza 400 si el post no está In progress o Active', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...mockPost, status: 'Paused' } as never)
    await expect(postService.completePost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })

  it('completa todos los posts In progress de un grupo SubContract', async () => {
    const subcontractPost = {
      ...mockPost,
      type: PostType.SubContract,
      subcontractGroupId: 'group-1',
    }
    const groupPosts = [
      { ...subcontractPost, id: 'uuid-1' },
      { ...subcontractPost, id: 'uuid-2' },
    ]
    vi.mocked(findPostById).mockResolvedValue(subcontractPost as never)
    vi.mocked(findPostsByGroupId).mockResolvedValue(groupPosts as never)
    vi.mocked(findAcceptedApplications).mockResolvedValue([])

    await postService.completePost('uuid-1', 'user-uuid-1')

    expect(findPostsByGroupId).toHaveBeenCalledWith('group-1')
    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-1')
    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-2')
    expect(rejectPendingApplications).toHaveBeenCalledTimes(2)
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Completed')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-2', 'Completed')
    expect(updatePostStatus).toHaveBeenCalledTimes(2)
  })

  it('procesa todos los posts no Completed/Cancelled en grupo SubContract al completar', async () => {
    const subcontractPost = {
      ...mockPost,
      type: PostType.SubContract,
      subcontractGroupId: 'group-1',
    }
    const groupPosts = [
      { ...subcontractPost, id: 'uuid-1' },
      { ...subcontractPost, id: 'uuid-2', status: 'Paused' },
      { ...subcontractPost, id: 'uuid-3', status: 'Completed' },
    ]
    vi.mocked(findPostById).mockResolvedValue(subcontractPost as never)
    vi.mocked(findPostsByGroupId).mockResolvedValue(groupPosts as never)
    vi.mocked(findAcceptedApplications).mockResolvedValue([])

    await postService.completePost('uuid-1', 'user-uuid-1')

    expect(rejectPendingApplications).toHaveBeenCalledTimes(2)
    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-1')
    expect(rejectPendingApplications).toHaveBeenCalledWith('uuid-2')
    expect(rejectPendingApplications).not.toHaveBeenCalledWith('uuid-3')
    expect(updatePostStatus).toHaveBeenCalledTimes(2)
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Completed')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-2', 'Completed')
  })
})

describe('post.service - reopenPost', () => {
  const mockInProgress = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    status: 'In progress',
  }

  it('reabre el post y resetea la aplicaciÃ³n aceptada a Pending', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockInProgress as never)
    vi.mocked(findAcceptedApplications).mockResolvedValue([{
      id: 'app-1',
      status: 'Accepted',
      createdAt: new Date(),
      updatedAt: new Date(),
      workerId: 'worker-uuid',
      postId: 'uuid-1',
      categoryId: null,
      subcontractGroupId: null,
      message: null,
      availableDays: null,
      availableTimeFrom: null,
      availableTimeTo: null,
      chargesVisit: false,
      visitCost: null,
      scheduledDate: null,
    } as never])
    vi.mocked(updateApplicationStatus).mockResolvedValue({
      id: 'app-1',
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      workerId: 'worker-uuid',
      postId: 'uuid-1',
      categoryId: null,
      subcontractGroupId: null,
      message: null,
      availableDays: null,
      availableTimeFrom: null,
      availableTimeTo: null,
      chargesVisit: false,
      visitCost: null,
      scheduledDate: null,
    } as never)
    vi.mocked(updatePostStatus).mockResolvedValue({ id: 'uuid-1', status: 'Active' } as never)

    await postService.reopenPost('uuid-1', 'user-uuid-1')

    expect(updateApplicationStatus).toHaveBeenCalledWith('app-1', 'Pending')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Active')
  })

  it('funciona aunque no haya aplicaciÃ³n aceptada', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockInProgress as never)
    vi.mocked(findAcceptedApplications).mockResolvedValue([])
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

  it('lanza 400 si el post no estÃ¡ In progress', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...mockInProgress, status: 'Active' } as never)
    await expect(postService.reopenPost('uuid-1', 'user-uuid-1')).rejects.toMatchObject({ status: 400 })
  })

  it('reactiva todos los posts In progress de un grupo SubContract', async () => {
    const subcontractPost = {
      ...mockInProgress,
      type: PostType.SubContract,
      subcontractGroupId: 'group-1',
    }
    const groupPosts = [
      { ...subcontractPost, id: 'uuid-1' },
      { ...subcontractPost, id: 'uuid-2' },
    ]
    vi.mocked(findPostById).mockResolvedValue(subcontractPost as never)
    vi.mocked(findPostsByGroupId).mockResolvedValue(groupPosts as never)
    vi.mocked(findAcceptedApplications).mockResolvedValue([])

    await postService.reopenPost('uuid-1', 'user-uuid-1')

    expect(findPostsByGroupId).toHaveBeenCalledWith('group-1')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Active')
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-2', 'Active')
    expect(updatePostStatus).toHaveBeenCalledTimes(2)
  })

  it('salta posts no In progress en grupo SubContract al reabrir', async () => {
    const subcontractPost = {
      ...mockInProgress,
      type: PostType.SubContract,
      subcontractGroupId: 'group-1',
    }
    const groupPosts = [
      { ...subcontractPost, id: 'uuid-1' },
      { ...subcontractPost, id: 'uuid-2', status: 'Active' },
      { ...subcontractPost, id: 'uuid-3', status: 'Completed' },
    ]
    vi.mocked(findPostById).mockResolvedValue(subcontractPost as never)
    vi.mocked(findPostsByGroupId).mockResolvedValue(groupPosts as never)
    vi.mocked(findAcceptedApplications).mockResolvedValue([])

    await postService.reopenPost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledTimes(1)
    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Active')
  })
})

describe('post.service - updatePost', () => {
  const activePost: DomainPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'ReparaciÃ³n de caÃ±o',
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
    title: 'TÃ­tulo editado',
    description: 'DescripciÃ³n editada',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-20'),
    address: 'Nueva direcciÃ³n 456',
    categoryId: 'uuid-category-1',
  }

  it('edita un post activo', async () => {
    vi.mocked(findPostById).mockResolvedValue(activePost)
    vi.mocked(updatePostData).mockResolvedValue({ ...activePost, title: 'TÃ­tulo editado' })

    const result = await postService.updatePost('uuid-1', 'user-uuid-1', updateInput)

    expect(updatePostData).toHaveBeenCalledWith('uuid-1', { userId: 'user-uuid-1', ...updateInput, emergencyExpiresAt: null })
    expect(result.title).toBe('TÃ­tulo editado')
  })

  it('edita un post pausado', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Paused' })
    vi.mocked(updatePostData).mockResolvedValue({ ...activePost, status: 'Paused', title: 'TÃ­tulo editado' })

    const result = await postService.updatePost('uuid-1', 'user-uuid-1', updateInput)

    expect(result.title).toBe('TÃ­tulo editado')
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
    it(`lanza 400 si el post estÃ¡ ${status}`, async () => {
      vi.mocked(findPostById).mockResolvedValue({ ...activePost, status })
      await expect(postService.updatePost('uuid-1', 'user-uuid-1', updateInput)).rejects.toMatchObject({ status: 400 })
    })
  }

  it('lanza error si el tÃ­tulo estÃ¡ vacÃ­o', async () => {
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
      { categoryId: 'cat-1', quantity: 2, roleDescription: 'AlbaÃ±ilerÃ­a general' },
      { categoryId: 'cat-2', quantity: 1, roleDescription: 'InstalaciÃ³n elÃ©ctrica' },
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

  const createMockSubPost = (overrides: Partial<DomainPost> = {}): DomainPost => ({
    id: `sub-post-${Math.random().toString(36).slice(2, 8)}`,
    userId: 'mmo-user-id',
    title: 'SubcontrataciÃ³n: Arreglo de cocina',
    description: '',
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
    ...overrides,
  })

  it('creates one subcontract per position with parentPostId', async () => {
    vi.mocked(findPostById).mockResolvedValue(parentPostMock)
    vi.mocked(findAcceptedApplication).mockResolvedValue({
      id: 'app-1',
      workerId: 'mmo-user-id',
      postId: 'parent-post-id',
      status: 'Accepted',
    } as never)
    vi.mocked(createSubPost)
      .mockResolvedValueOnce(createMockSubPost({ title: 'SubcontrataciÃ³n: Arreglo de cocina - AlbaÃ±ilerÃ­a general' }))
      .mockResolvedValueOnce(createMockSubPost({ title: 'SubcontrataciÃ³n: Arreglo de cocina - InstalaciÃ³n elÃ©ctrica' }))

    const results = await postService.createSubContract(validInput)

    expect(findPostById).toHaveBeenCalledWith('parent-post-id')
    expect(findAcceptedApplication).toHaveBeenCalledWith('parent-post-id')
    expect(createSubPost).toHaveBeenCalledTimes(2)
    expect(results).toHaveLength(2)
    expect(results[0].title).toBe('SubcontrataciÃ³n: Arreglo de cocina - AlbaÃ±ilerÃ­a general')
    expect(results[1].title).toBe('SubcontrataciÃ³n: Arreglo de cocina - InstalaciÃ³n elÃ©ctrica')
    expect(createSubPost).toHaveBeenNthCalledWith(1, expect.objectContaining({
      positions: [{ categoryId: 'cat-1', quantity: 2, roleDescription: 'AlbaÃ±ilerÃ­a general' }],
    }))
    expect(createSubPost).toHaveBeenNthCalledWith(2, expect.objectContaining({
      positions: [{ categoryId: 'cat-2', quantity: 1, roleDescription: 'InstalaciÃ³n elÃ©ctrica' }],
    }))
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

  it('creates one subcontract per position without parentPostId', async () => {
    const noParentInput: CreateSubcontractCommand = {
      userId: 'mmo-user-id',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-15'),
      address: 'Otra calle 456',
      positions: [{ categoryId: 'cat-1', quantity: 1, roleDescription: 'Pintura' }],
    }
    vi.mocked(createSubPost).mockResolvedValue(
      createMockSubPost({ parentPostId: undefined, title: 'SubcontrataciÃ³n - Pintura' })
    )

    const results = await postService.createSubContract(noParentInput)

    expect(createSubPost).toHaveBeenCalledTimes(1)
    expect(results).toHaveLength(1)
    expect(results[0].parentPostId).toBeUndefined()
    expect(results[0].title).toBe('SubcontrataciÃ³n - Pintura')
    expect(createSubPost).toHaveBeenCalledWith(expect.objectContaining({
      positions: [{ categoryId: 'cat-1', quantity: 1, roleDescription: 'Pintura' }],
      parentPostId: undefined,
    }))
  })
})

describe('post.service - markInProgress', () => {
  const postId = 'post-1'
  const userId = 'user-1'
  const mockPost: DomainPost = {
    id: postId, userId, title: 'Test', description: 'Test', address: 'Addr',
    startDate: new Date(), endDate: new Date(), status: 'Active',
    isEmergency: false, emergencyExpiresAt: undefined,
    categories: [], images: [], createdAt: new Date(), updatedAt: new Date(),
    latitude: null, longitude: null,
    user: { id: userId, name: 'Test', surname: 'User' },
  } as unknown as DomainPost

  it('should reject if post not found', async () => {
    vi.mocked(findPostById).mockResolvedValue(null)
    await expect(postService.markInProgress(postId, userId)).rejects.toThrow('Post not found')
  })

  it('should reject if forbidden', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...mockPost, userId: 'other' })
    await expect(postService.markInProgress(postId, userId)).rejects.toThrow('Forbidden')
  })

  it('should reject if post is not Active', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...mockPost, status: 'In progress' })
    await expect(postService.markInProgress(postId, userId)).rejects.toThrow('Post must be active')
  })

  it('should reject if no hired workers', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)
    vi.mocked(findPostCategories).mockResolvedValue([{ id: 'cat-1', postId, quantity: 2, filledCount: 0 } as never])
    await expect(postService.markInProgress(postId, userId)).rejects.toThrow('Must have at least one hired worker')
  })

  it('should update status to InProgress for client post', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)
    vi.mocked(findPostCategories).mockResolvedValue([{ id: 'cat-1', postId, quantity: 2, filledCount: 1 } as never])
    vi.mocked(updatePostStatus).mockResolvedValue({ id: postId, status: 'In progress' })
    const result = await postService.markInProgress(postId, userId)
    expect(updatePostStatus).toHaveBeenCalledWith(postId, 'In progress')
    expect(result).toEqual({ id: postId, status: 'In progress' })
  })

  it('should cascade to all posts in subcontractGroupId', async () => {
    const groupId = 'group-1'
    const categoriesWithHired = [{ id: 'cat-1', name: 'Test', quantity: 1, filledCount: 1, roleDescription: null }]
    const groupPost2 = { ...mockPost, id: 'post-2', subcontractGroupId: groupId, categories: categoriesWithHired }
    const groupPost3 = { ...mockPost, id: 'post-3', status: 'In progress', subcontractGroupId: groupId, categories: categoriesWithHired }
    vi.mocked(findPostById).mockResolvedValue({ ...mockPost, type: PostType.SubContract, subcontractGroupId: groupId })
    vi.mocked(findPostCategories).mockResolvedValue([{ id: 'cat-1', postId, quantity: 1, filledCount: 1 } as never])
    vi.mocked(findPostsByGroupId).mockResolvedValue([{ ...mockPost, type: PostType.SubContract, subcontractGroupId: groupId, categories: categoriesWithHired }, groupPost2, groupPost3])
    await postService.markInProgress(postId, userId)
    expect(updatePostStatus).toHaveBeenCalledWith(postId, 'In progress')
    expect(updatePostStatus).toHaveBeenCalledWith('post-2', 'In progress')
    expect(updatePostStatus).not.toHaveBeenCalledWith('post-3', 'In progress')
  })
})

describe('post.service - createPost emergency', () => {
  const emergencyInput: CreatePostInput = {
    userId: 'uuid-user-1',
    title: 'CaÃ±o roto urgente',
    description: 'Se inundÃ³ el baÃ±o',
    address: 'Calle 123',
    categoryId: 'uuid-category-1',
    isEmergency: true,
  }

  const createdEmergencyPost: DomainPost = {
    id: 'uuid-emergency-1',
    userId: 'uuid-user-1',
    title: 'CaÃ±o roto urgente',
    description: 'Se inundÃ³ el baÃ±o',
    address: 'Calle 123',
    startDate: new Date(),
    endDate: new Date(),
    status: 'Active',
    createdAt: new Date(),
    images: [],
    latitude: null,
    longitude: null,
    categories: [],
    user: { id: 'uuid-user-1', name: 'Test', surname: 'User' },
  }

  it('creates emergency post and broadcasts to workers', async () => {
    vi.mocked(createPost).mockResolvedValue(createdEmergencyPost)
    vi.mocked(broadcastEmergency).mockResolvedValue(undefined)

    const result = await postService.createPost(emergencyInput)

    expect(createPost).toHaveBeenCalledWith(
      expect.objectContaining({ emergencyExpiresAt: expect.any(Date) })
    )
    expect(broadcastEmergency).toHaveBeenCalledWith(
      expect.anything(),
      createdEmergencyPost.id,
      emergencyInput.title,
      emergencyInput.description,
      emergencyInput.categoryId,
    )
    expect(result.id).toBe('uuid-emergency-1')
  })

  it('does not fail when broadcastEmergency throws', async () => {
    vi.mocked(createPost).mockResolvedValue(createdEmergencyPost)
    vi.mocked(broadcastEmergency).mockRejectedValue(new Error('Telegram down'))

    const result = await postService.createPost(emergencyInput)

    expect(result.id).toBe('uuid-emergency-1')
  })
})

describe('post.service - validatePostInput', () => {
  it('skips date validation when isEmergency is true', () => {
    expect(() =>
      postService.validatePostInput({
        userId: 'u-1',
        title: 'Emergency',
        description: 'Urgent',
        address: 'Calle 1',
        categoryId: 'cat-1',
        isEmergency: true,
      })
    ).not.toThrow()
  })

  it('throws when startDate and endDate are missing for non-emergency', () => {
    expect(() =>
      postService.validatePostInput({
        userId: 'u-1',
        title: 'Title',
        description: 'Desc',
        address: 'Addr',
        categoryId: 'cat-1',
      })
    ).toThrow('startDate and endDate are required')
  })
})

describe('post.service - listEmergencyPosts', () => {
  const mockEmergencyPost: DomainPost = {
    id: 'emg-1',
    userId: 'user-1',
    title: 'CaÃ±o roto',
    description: 'Urgente',
    address: 'Calle 1',
    startDate: new Date(),
    endDate: new Date(),
    status: 'Active',
    createdAt: new Date(),
    images: [],
    latitude: null,
    longitude: null,
    categories: [],
    user: { id: 'user-1', name: 'Test', surname: 'User' },
  }

  it('returns emergency posts enriched with client rating', async () => {
    vi.mocked(findEmergencyPosts).mockResolvedValue([mockEmergencyPost])
    vi.mocked(getUserRating).mockResolvedValue({ averageRating: 3.5, reviewCount: 2 })

    const result = await postService.listEmergencyPosts()

    expect(findEmergencyPosts).toHaveBeenCalledWith(undefined)
    expect(result[0].clientRating).toBe(3.5)
  })

  it('filters by category when provided', async () => {
    vi.mocked(findEmergencyPosts).mockResolvedValue([])

    await postService.listEmergencyPosts('PlomerÃ­a')

    expect(findEmergencyPosts).toHaveBeenCalledWith('PlomerÃ­a')
  })
})

describe('post.service - cancelPost with accepted application', () => {
  const activePost: DomainPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'ReparaciÃ³n de caÃ±o',
    description: 'Test',
    address: 'Calle 123',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-15'),
    status: 'Active',
    createdAt: new Date(),
    images: [],
    latitude: null,
    longitude: null,
    categories: [],
    user: { id: 'user-uuid-1', name: 'Test', surname: 'User' },
  }

  it('notifies accepted worker when cancelling', async () => {
    vi.mocked(findPostById).mockResolvedValue(activePost)
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Cancelled' } as never)
    vi.mocked(findAcceptedApplications).mockResolvedValue([{
      id: 'app-1', workerId: 'worker-1', postId: 'uuid-1', status: 'Accepted',
    }] as never)

    await postService.cancelPost('uuid-1', 'user-uuid-1')

    expect(notifyUser).toHaveBeenCalledWith(
      expect.anything(),
      'worker-1',
      'post_cancelled',
      { postTitle: 'ReparaciÃ³n de caÃ±o' },
    )
  })
})

describe('post.service - finalizePost with accepted application', () => {
  const pausedPost: DomainPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'ReparaciÃ³n de caÃ±o',
    description: 'Test',
    address: 'Calle 123',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-15'),
    status: 'Paused',
    createdAt: new Date(),
    images: [],
    latitude: null,
    longitude: null,
    categories: [],
    user: { id: 'user-uuid-1', name: 'Test', surname: 'User' },
  }

  it('marks accepted application as Completed before finalizing', async () => {
    vi.mocked(findPostById).mockResolvedValue(pausedPost)
    vi.mocked(findAcceptedApplications).mockResolvedValue([{
      id: 'app-1', workerId: 'worker-1', postId: 'uuid-1', status: 'Accepted',
    }] as never)
    vi.mocked(updateApplicationStatus).mockResolvedValue({ id: 'app-1', status: 'Completed' } as never)
    vi.mocked(updatePostStatus).mockResolvedValue({ ...pausedPost, status: 'Completed' } as never)

    await postService.finalizePost('uuid-1', 'user-uuid-1')

    expect(updateApplicationStatus).toHaveBeenCalledWith('app-1', 'Completed')
    expect(notifyUser).toHaveBeenCalledWith(
      expect.anything(),
      'worker-1',
      'post_completed',
      { postTitle: 'ReparaciÃ³n de caÃ±o' },
    )
  })
})

describe('post.service - completePost with accepted application', () => {
  const inProgressPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'ReparaciÃ³n de caÃ±o',
    status: 'In progress',
  }

  it('marks accepted application as Completed before completing', async () => {
    vi.mocked(findPostById).mockResolvedValue(inProgressPost as never)
    vi.mocked(findAcceptedApplications).mockResolvedValue([{
      id: 'app-1', workerId: 'worker-1', postId: 'uuid-1', status: 'Accepted',
    }] as never)
    vi.mocked(updateApplicationStatus).mockResolvedValue({ id: 'app-1', status: 'Completed' } as never)
    vi.mocked(updatePostStatus).mockResolvedValue({ ...inProgressPost, status: 'Completed' } as never)

    await postService.completePost('uuid-1', 'user-uuid-1')

    expect(updateApplicationStatus).toHaveBeenCalledWith('app-1', 'Completed')
    expect(notifyUser).toHaveBeenCalledWith(
      expect.anything(),
      'worker-1',
      'post_completed',
      { postTitle: 'ReparaciÃ³n de caÃ±o' },
    )
  })
})


