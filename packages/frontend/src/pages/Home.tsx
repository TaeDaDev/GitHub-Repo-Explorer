import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { RepoList } from '../components/RepoList'
import { AuthModal } from '../components/AuthModal'
import { useRepos } from '../hooks/useRepos'
import { useFavorites } from '../hooks/useFavorites'
import { useAuth } from '../hooks/useAuth'

export const Home: React.FC = () => {
  const [username, setUsername] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const { token, user, login, register, logout, isAuthenticated } = useAuth()
  const { data: repos = [], isLoading, error } = useRepos(username)
  const { isFavorited, addFavorite, removeFavorite } = useFavorites(token)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">GitHub Repo Explorer</h1>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/favorites" className="text-sm text-blue-600 hover:underline">My Favorites</Link>
                <span className="text-sm text-gray-500">{user?.email}</span>
                <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900">Log out</button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                Log in
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        <SearchBar onSearch={setUsername} isLoading={isLoading} />
        <RepoList repos={repos} isLoading={isLoading} error={error as Error | null}
          username={username} getFavoriteId={isFavorited} onSave={addFavorite}
          onRemove={removeFavorite} isAuthenticated={isAuthenticated} onAuthRequired={() => setShowAuth(true)} />
      </main>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} onLogin={login} onRegister={register} />
    </div>
  )
}
