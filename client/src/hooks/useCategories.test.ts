import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCategories } from '../services/categories'
import { useCategories } from './useCategories'

vi.mock('../services/categories', () => ({ fetchCategories: vi.fn() }))

type CategoryResponse = Awaited<ReturnType<typeof fetchCategories>>

beforeEach(() => vi.resetAllMocks())
afterEach(() => cleanup())

describe('useCategories', () => {
  it('treats an invalid API response as a load error instead of an empty catalog', async () => {
    vi.mocked(fetchCategories).mockResolvedValue({ data: { error: 'Invalid response' } } as unknown as CategoryResponse)
    const { result } = renderHook(() => useCategories())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toContain('No pudimos cargar las especialidades')
  })

  it('keeps the retry result when an older request finishes afterwards', async () => {
    let resolveOld: (value: CategoryResponse) => void = () => undefined
    const oldRequest = new Promise<CategoryResponse>((resolve) => { resolveOld = resolve })
    const fresh = [{ id: 'new-id', name: 'Electricidad' }]
    vi.mocked(fetchCategories).mockReturnValueOnce(oldRequest)
      .mockResolvedValueOnce({ data: fresh } as CategoryResponse)
    const { result } = renderHook(() => useCategories())

    act(() => result.current.retry())
    await waitFor(() => expect(result.current.categories).toEqual(fresh))
    await act(async () => {
      resolveOld({ data: [{ id: 'old-id', name: 'Pintura' }] } as CategoryResponse)
      await oldRequest
    })

    expect(result.current.categories).toEqual(fresh)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })
})
