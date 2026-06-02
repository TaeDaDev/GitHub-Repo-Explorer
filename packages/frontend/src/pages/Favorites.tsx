import React from 'react'
import { Link } from 'react-router-dom'
import { Star, ExternalLink, Trash2 } from 'lucide-react'
import { useFavorites } from '../hooks/useFavorites'
import { useAuth } from '../hooks/useAuth'
import type { Favorite } from '@github-explorer/shared'

export const Favorites: React.FC = () => {
  const { token, user, logout } = useAuth()
  const { favorites, isLoading, removeFavorite } = useFavorites(token)

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600">Please <Link to="/" className="text-blue-600 hover:underline">log in</Link> to view your favorites.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">GitHub Repo Explorer</Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900">Log out</button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Favorites</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : favorites.length === 0 ? (
          <p className="text-gray-500">No favorites yet. <Link to="/" className="text-blue-600 hover:underline">Search for repos</Link> to save some.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((fav: Favorite) => (
              <div key={fav.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <a href={fav.htmlUrl} target="_blank" rel="noopener noreferrer"
                    className="font-semibold text-blue-600 hover:underline flex items-center gap-1 min-w-0">
                    <span className="truncate">{fav.name}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <button onClick={() => removeFavorite(fav.id)} aria-label="Remove favorite"
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-full transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {fav.description && <p className="text-sm text-gray-600 line-clamp-2">{fav.description}</p>}
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
                  {fav.language && <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">{fav.language}</span>}
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" />
                    {fav.stargazersCount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
