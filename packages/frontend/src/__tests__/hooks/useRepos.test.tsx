import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import axios from 'axios'
import { useRepos } from '../../hooks/useRepos'
import type { GitHubRepo } from '@github-explorer/shared'

vi.mock('axios')
const mockAxios = axios as unknown as { get: ReturnType<typeof vi.fn> }

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

const fakeRepos: GitHubRepo[] = [
  { id: 1, name: 'repo1', description: null, stargazers_count: 5, html_url: 'https://github.com/u/repo1', language: 'TS', full_name: 'u/repo1' }
]

describe('useRepos', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns repos on success', async () => {
    mockAxios.get = vi.fn().mockResolvedValue({ data: fakeRepos })
    const { result } = renderHook(() => useRepos('testuser'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(fakeRepos)
  })

  it('does not fetch when username is empty', () => {
    mockAxios.get = vi.fn()
    renderHook(() => useRepos(''), { wrapper })
    expect(mockAxios.get).not.toHaveBeenCalled()
  })

  it('sets error on failed fetch', async () => {
    mockAxios.get = vi.fn().mockRejectedValue(new Error('Not Found'))
    const { result } = renderHook(() => useRepos('nobody'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
