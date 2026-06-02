import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Favorite, GitHubRepo } from '@github-explorer/shared'

const getFavorites = async (): Promise<Favorite[]> => (await api.get<Favorite[]>('/user/favorites')).data
const addFavorite = async (repo: GitHubRepo): Promise<Favorite> => (await api.post<Favorite>('/user/favorites', repo)).data
const removeFavorite = async (id: string): Promise<void> => { await api.delete(`/user/favorites/${id}`) }

export const useFavorites = (token: string | null) => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: !!token
  })

  const addMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] })
  })

  const removeMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] })
  })

  const isFavorited = (githubRepoId: number): string | undefined =>
    query.data?.find((f) => f.githubRepoId === githubRepoId)?.id

  return {
    favorites: query.data ?? [],
    isLoading: query.isLoading,
    addFavorite: addMutation.mutate,
    removeFavorite: removeMutation.mutate,
    isFavorited
  }
}
