import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPost, findPostById, findPostsByUser, updatePostStatus, findAvailablePosts, searchByDistance, type PostWithCategories, type UserPostSummary } from "../../src/data/post.data.js";
import { findAcceptedApplication, updateApplicationStatus } from "../../src/data/application.data.js";
import * as postService from "../../src/services/post.service.js";
import type { PostInput } from "../../src/types/postInput.js";

vi.mock("../../src/data/post.data.js", () => ({
  createPost: vi.fn(),
  findPostsByUser: vi.fn(),
  findPostById: vi.fn(),
  updatePostStatus: vi.fn(),
  findAvailablePosts: vi.fn(),
  searchByDistance: vi.fn(),
}));

vi.mock("../../src/data/application.data.js", () => ({
  findAcceptedApplication: vi.fn(),
  updateApplicationStatus: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe("post.service - createPost", () => {
  const inputData: PostInput = {
    userId: 'uuid-user-1',
    title: "Tubo roto en cocina",
    description: "El tubo bajo el lavaplatos está roto",
    startDate: new Date("2026-06-01T00:00:00.000Z"),
    endDate: new Date("2026-06-15T00:00:00.000Z"),
    address: "Calle Principal 123, Apt 4B",
    categoryId: 'uuid-category-1',
  };
  const createdPostMock: PostWithCategories = {
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

    expect(createPost).toHaveBeenCalledWith(inputData);

    expect(result).toEqual(createdPostMock);
  });
});

describe("post.service - getPostById", () => {
  const postDetailMock: PostWithCategories = {
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
    categories: [
      {
        category: { id: 'uuid-category-1', name: "Plomeria" },
      },
    ],
    user: { id: 'uuid-user-1', name: "Test User", surname: "Test" },
  };

  it("should return a post by id", async () => {
    vi.mocked(findPostById).mockResolvedValue(postDetailMock);

    const result = await postService.getPostById('uuid-post-1');

    expect(findPostById).toHaveBeenCalledWith('uuid-post-1');
    expect(result).toBeDefined();
    expect(result!.id).toBe('uuid-post-1');
    expect(result!.title).toBe('Tubo roto en cocina');
  });

  it("should return null when post does not exist", async () => {
    vi.mocked(findPostById).mockResolvedValue(null);

    const result = await postService.getPostById('non-existent-id');

    expect(findPostById).toHaveBeenCalledWith('non-existent-id');
    expect(result).toBeNull();
  });
});

describe("post.service - getUserPosts", () => {
  const userPostsMock: UserPostSummary[] = [
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
  const mockPost = {
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
    categories: [{ category: { id: "uuid-cat-1", name: "Plomero" } }],
    user: { id: "uuid-user-1", name: "Test", surname: "User" },
  };

  it("should return available posts without category filter", async () => {
    vi.mocked(findAvailablePosts).mockResolvedValue([mockPost]);

    const result = await postService.listAvailablePosts();

    expect(findAvailablePosts).toHaveBeenCalledWith(undefined);
    expect(result).toHaveLength(1);
    expect(result[0].categories).toEqual([{ id: "uuid-cat-1", name: "Plomero" }]);
  });

  it("should filter available posts by category", async () => {
    vi.mocked(findAvailablePosts).mockResolvedValue([mockPost]);

    const result = await postService.listAvailablePosts("Plomero");

    expect(findAvailablePosts).toHaveBeenCalledWith("Plomero");
    expect(result).toHaveLength(1);
  });

  it("should return empty array when no posts match", async () => {
    vi.mocked(findAvailablePosts).mockResolvedValue([]);

    const result = await postService.listAvailablePosts("NonExistent");

    expect(result).toEqual([]);
  });
});

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
  const activePost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'Reparación de caño',
    description: 'Test',
    address: 'Calle 123',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-15'),
    status: 'Active' as const,
    createdAt: new Date("2026-05-25"),
    images: [],
    latitude: null,
    longitude: null,
    categories: [
      {
        category: { id: 'uuid-category-1', name: "Plomeria" },
      },
    ],
    user: { id: 'user-uuid-1', name: 'Test', surname: 'User', phone: null },
  }

  it('pausa un post activo', async () => {
    vi.mocked(findPostById).mockResolvedValue(activePost)
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Paused', updatedAt: new Date() })

    const result = await postService.pausePost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Paused')
    expect(result.status).toBe('Paused')
  })

  it('activa un post pausado', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Paused' })
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Active', updatedAt: new Date() })

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
  const activePost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'Reparación de caño',
    description: 'Test',
    address: 'Calle 123',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-15'),
    status: 'Active' as const,
    createdAt: new Date("2026-05-25"),
    images: [],
    latitude: null,
    longitude: null,
    categories: [
      {
        category: { id: 'uuid-category-1', name: "Plomeria" },
      },
    ],
    user: { id: 'user-uuid-1', name: 'Test', surname: 'User', phone: null },
  }

  it('cancela un post activo', async () => {
    vi.mocked(findPostById).mockResolvedValue(activePost)
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Cancelled', updatedAt: new Date() })

    const result = await postService.cancelPost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Cancelled')
    expect(result.status).toBe('Cancelled')
  })

  it('cancela un post pausado', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'Paused' })
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Cancelled', updatedAt: new Date() })

    const result = await postService.cancelPost('uuid-1', 'user-uuid-1')

    expect(updatePostStatus).toHaveBeenCalledWith('uuid-1', 'Cancelled')
    expect(result.status).toBe('Cancelled')
  })

  it('cancela un post en In progress', async () => {
    vi.mocked(findPostById).mockResolvedValue({ ...activePost, status: 'In progress' })
    vi.mocked(updatePostStatus).mockResolvedValue({ ...activePost, status: 'Cancelled', updatedAt: new Date() })

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
  const mockPost = {
    id: 'uuid-1',
    userId: 'user-uuid-1',
    title: 'Reparación de caño',
    description: 'Test',
    address: 'Calle 123',
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-15'),
    status: 'Paused' as const,
    createdAt: new Date("2026-05-25"),
    images: [],
    latitude: null,
    longitude: null,
    categories: [
      {
        category: { id: 'uuid-category-1', name: "Plomeria" },
      },
    ],
    user: { id: 'user-uuid-1', name: 'Test', surname: 'User', phone: null },
  }

  it('finaliza el post cuando está pausado y pertenece al usuario', async () => {
    vi.mocked(findPostById).mockResolvedValue(mockPost)

    vi.mocked(updatePostStatus).mockResolvedValue({ ...mockPost, status: 'Completed', updatedAt: new Date() })

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
    })
    vi.mocked(updateApplicationStatus).mockResolvedValue({
      id: 'app-1',
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      workerId: 'worker-uuid',
      postId: 'uuid-1',
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


