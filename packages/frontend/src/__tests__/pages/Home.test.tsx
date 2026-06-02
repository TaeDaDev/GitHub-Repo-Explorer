import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'
import { Home } from '../../pages/Home'

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ token: null, user: null, login: vi.fn(), register: vi.fn(), logout: vi.fn(), isAuthenticated: false })
}))
vi.mock('../../hooks/useRepos', () => ({
  useRepos: () => ({ data: [], isLoading: false, error: null })
}))
vi.mock('../../hooks/useFavorites', () => ({
  useFavorites: () => ({ favorites: [], addFavorite: vi.fn(), removeFavorite: vi.fn(), isFavorited: () => undefined })
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
)

describe('Home page', () => {
  it('renders the page header and search bar', () => {
    render(<Home />, { wrapper })
    expect(screen.getByText('GitHub Repo Explorer')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter GitHub username...')).toBeInTheDocument()
  })

  it('shows Log in button when not authenticated', () => {
    render(<Home />, { wrapper })
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('opens auth modal when Log in button is clicked', async () => {
    render(<Home />, { wrapper })
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument())
  })
})
