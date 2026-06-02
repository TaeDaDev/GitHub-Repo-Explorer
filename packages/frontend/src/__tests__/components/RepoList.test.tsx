import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RepoList } from '../../components/RepoList'
import type { GitHubRepo } from '@github-explorer/shared'

const fakeRepos: GitHubRepo[] = [
  { id: 1, name: 'repo-a', description: 'Desc A', stargazers_count: 10, html_url: 'https://github.com/u/a', language: 'Go', full_name: 'u/a' },
  { id: 2, name: 'repo-b', description: null, stargazers_count: 0, html_url: 'https://github.com/u/b', language: null, full_name: 'u/b' }
]

const defaultProps = {
  repos: fakeRepos, isLoading: false, error: null, username: 'testuser',
  getFavoriteId: () => undefined, onSave: vi.fn(), onRemove: vi.fn(),
  isAuthenticated: false, onAuthRequired: vi.fn()
}

describe('RepoList', () => {
  it('renders a card for each repo', () => {
    render(<RepoList {...defaultProps} />)
    expect(screen.getByText('repo-a')).toBeInTheDocument()
    expect(screen.getByText('repo-b')).toBeInTheDocument()
  })

  it('shows loading skeletons when isLoading is true', () => {
    render(<RepoList {...defaultProps} repos={[]} isLoading={true} />)
    expect(screen.getAllByTestId('skeleton')).toHaveLength(6)
  })

  it('shows not found message on 404 error', () => {
    const err = Object.assign(new Error('Not found'), { response: { status: 404 } })
    render(<RepoList {...defaultProps} repos={[]} error={err} />)
    expect(screen.getByText(/testuser.*not found/i)).toBeInTheDocument()
  })

  it('shows generic error message on non-404 error', () => {
    render(<RepoList {...defaultProps} repos={[]} error={new Error('Network error')} />)
    expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument()
  })

  it('shows empty state when user has no repos', () => {
    render(<RepoList {...defaultProps} repos={[]} />)
    expect(screen.getByText(/no public repositories/i)).toBeInTheDocument()
  })

  it('renders nothing when username is empty', () => {
    const { container } = render(<RepoList {...defaultProps} username="" repos={[]} />)
    expect(container.firstChild).toBeNull()
  })
})
