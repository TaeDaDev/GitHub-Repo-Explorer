import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RepoCard } from '../../components/RepoCard'
import type { GitHubRepo } from '@github-explorer/shared'

const mockRepo: GitHubRepo = {
  id: 1, name: 'cool-repo', description: 'Does cool things',
  stargazers_count: 42, html_url: 'https://github.com/user/cool-repo',
  language: 'TypeScript', full_name: 'user/cool-repo'
}

describe('RepoCard', () => {
  it('renders repo name, description, stars, and language', () => {
    render(<RepoCard repo={mockRepo} onSave={vi.fn()} onRemove={vi.fn()} isAuthenticated={true} onAuthRequired={vi.fn()} />)
    expect(screen.getByText('cool-repo')).toBeInTheDocument()
    expect(screen.getByText('Does cool things')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('calls onSave with the repo when authenticated user clicks save', () => {
    const onSave = vi.fn()
    render(<RepoCard repo={mockRepo} onSave={onSave} onRemove={vi.fn()} isAuthenticated={true} onAuthRequired={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /save to favorites/i }))
    expect(onSave).toHaveBeenCalledWith(mockRepo)
  })

  it('calls onAuthRequired instead of onSave when not authenticated', () => {
    const onSave = vi.fn(); const onAuthRequired = vi.fn()
    render(<RepoCard repo={mockRepo} onSave={onSave} onRemove={vi.fn()} isAuthenticated={false} onAuthRequired={onAuthRequired} />)
    fireEvent.click(screen.getByRole('button', { name: /save to favorites/i }))
    expect(onAuthRequired).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onRemove with favoriteId when already favorited', () => {
    const onRemove = vi.fn()
    render(<RepoCard repo={mockRepo} favoriteId="fav1" onSave={vi.fn()} onRemove={onRemove} isAuthenticated={true} onAuthRequired={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /remove from favorites/i }))
    expect(onRemove).toHaveBeenCalledWith('fav1')
  })
})
