import React from 'react'
import type { GitHubRepo } from '@github-explorer/shared'
import { RepoCard } from './RepoCard'

interface Props {
  repos: GitHubRepo[]
  isLoading: boolean
  error: Error | null
  username: string
  getFavoriteId: (repoId: number) => string | undefined
  onSave: (repo: GitHubRepo) => void
  onRemove: (id: string) => void
  isAuthenticated: boolean
  onAuthRequired: () => void
}

export const RepoList: React.FC<Props> = ({ repos, isLoading, error, username, getFavoriteId, onSave, onRemove, isAuthenticated, onAuthRequired }) => {
  if (!username) return null

  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} data-testid="skeleton" className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  )

  if (error) {
    const is404 = (error as any).response?.status === 404
    return <p className="text-center text-red-500 py-8">
      {is404 ? `User "${username}" not found on GitHub` : 'Failed to fetch repositories. Please try again.'}
    </p>
  }

  if (repos.length === 0) return <p className="text-center text-gray-500 py-8">{username} has no public repositories.</p>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} favoriteId={getFavoriteId(repo.id)}
          onSave={onSave} onRemove={onRemove} isAuthenticated={isAuthenticated} onAuthRequired={onAuthRequired} />
      ))}
    </div>
  )
}
