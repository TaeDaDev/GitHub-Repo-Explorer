import React from 'react'
import { Star, ExternalLink } from 'lucide-react'
import type { GitHubRepo } from '@github-explorer/shared'
import { FavoriteButton } from './FavoriteButton'

interface Props {
  repo: GitHubRepo
  favoriteId?: string
  onSave: (repo: GitHubRepo) => void
  onRemove: (id: string) => void
  isAuthenticated: boolean
  onAuthRequired: () => void
}

export const RepoCard: React.FC<Props> = ({ repo, favoriteId, onSave, onRemove, isAuthenticated, onAuthRequired }) => (
  <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm flex flex-col gap-2">
    <div className="flex items-start justify-between gap-2">
      <a href={repo.html_url} target="_blank" rel="noopener noreferrer"
        className="font-semibold text-blue-600 hover:underline flex items-center gap-1 min-w-0">
        <span className="truncate">{repo.name}</span>
        <ExternalLink className="w-3 h-3 shrink-0" />
      </a>
      <FavoriteButton
        isFavorited={!!favoriteId}
        onSave={() => isAuthenticated ? onSave(repo) : onAuthRequired()}
        onRemove={() => favoriteId && onRemove(favoriteId)}
      />
    </div>
    {repo.description && <p className="text-sm text-gray-600 line-clamp-2">{repo.description}</p>}
    <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
      {repo.language && <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">{repo.language}</span>}
      <span className="flex items-center gap-1">
        <Star className="w-3.5 h-3.5" />
        {repo.stargazers_count.toLocaleString()}
      </span>
    </div>
  </div>
)
