import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { useFavorites } from '../../hooks/useFavorites'
import type { Favorite } from '@github-explorer/shared'

vi.mock('../../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() }
}))

import { api } from '../../lib/api'
const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

const fakeFav: Favorite = {
  id: 'fav1', userId: 'u1', githubRepoId: 1, name: 'repo1',
  description: null, stargazersCount: 5, htmlUrl: 'https://github.com/u/repo1',
  language: 'TS', fullName: 'u/repo1', createdAt: new Date().toISOString()
}

describe('useFavorites', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches favorites when token provided', async () => {
    mockApi.get = vi.fn().mockResolvedValue({ data: [fakeFav] })
    const { result } = renderHook(() => useFavorites('some-token'), { wrapper })
    await waitFor(() => expect(result.current.favorites).toHaveLength(1))
    expect(result.current.favorites[0].name).toBe('repo1')
  })

  it('does not fetch when token is null', () => {
    mockApi.get = vi.fn()
    renderHook(() => useFavorites(null), { wrapper })
    expect(mockApi.get).not.toHaveBeenCalled()
  })

  it('isFavorited returns the favorite id when repo is saved', async () => {
    mockApi.get = vi.fn().mockResolvedValue({ data: [fakeFav] })
    const { result } = renderHook(() => useFavorites('token'), { wrapper })
    await waitFor(() => expect(result.current.favorites).toHaveLength(1))
    expect(result.current.isFavorited(1)).toBe('fav1')
    expect(result.current.isFavorited(999)).toBeUndefined()
  })
})
